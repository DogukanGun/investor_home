from __future__ import annotations

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlmodel import Session, select

from app.db import get_session
from app.models import AreaStat, ListingKind

router = APIRouter(prefix="/api/areas", tags=["areas"])


class AreaSummary(BaseModel):
    area_key: str
    sale_median_ppm2: float | None
    rent_median_ppm2: float | None
    sale_samples: int
    rent_samples: int


class IndexPoint(BaseModel):
    period: str
    median_price_per_m2: float | None
    index: float | None
    sample_count: int


class AreaTrend(BaseModel):
    area_key: str
    sale_current: float | None
    sale_previous: float | None
    sale_trend_pct: float | None   # positive = price went up, negative = went down
    rent_current: float | None
    rent_previous: float | None
    sale_samples: int
    p25_ppm2: float | None
    p75_ppm2: float | None


@router.get("", response_model=list[AreaSummary])
def list_areas(session: Session = Depends(get_session)):
    stats = session.exec(select(AreaStat).order_by(AreaStat.period.desc())).all()
    latest: dict[tuple[str, ListingKind], AreaStat] = {}
    for s in stats:
        latest.setdefault((s.area_key, s.listing_kind), s)
    keys = {k for (k, _) in latest}
    out = []
    for key in sorted(keys):
        sale = latest.get((key, ListingKind.sale))
        rent = latest.get((key, ListingKind.rent))
        out.append(
            AreaSummary(
                area_key=key,
                sale_median_ppm2=sale.median_price_per_m2 if sale else None,
                rent_median_ppm2=rent.median_price_per_m2 if rent else None,
                sale_samples=sale.sample_count if sale else 0,
                rent_samples=rent.sample_count if rent else 0,
            )
        )
    return out


@router.get("/trends", response_model=list[AreaTrend])
def area_trends(session: Session = Depends(get_session)):
    """Current + previous period median per area, with % change and p25/p75."""
    stats = session.exec(select(AreaStat).order_by(AreaStat.period.desc())).all()

    # Collect latest two periods per (area_key, listing_kind)
    by_area: dict[tuple[str, ListingKind], list[AreaStat]] = {}
    for s in stats:
        key = (s.area_key, s.listing_kind)
        bucket = by_area.setdefault(key, [])
        if len(bucket) < 2:
            bucket.append(s)

    area_keys = sorted({k for (k, _) in by_area})
    out = []
    for ak in area_keys:
        sale_rows = by_area.get((ak, ListingKind.sale), [])
        rent_rows = by_area.get((ak, ListingKind.rent), [])
        cur_s = sale_rows[0] if sale_rows else None
        prev_s = sale_rows[1] if len(sale_rows) > 1 else None
        cur_r = rent_rows[0] if rent_rows else None

        trend = None
        if cur_s and prev_s and cur_s.median_price_per_m2 and prev_s.median_price_per_m2:
            trend = round(
                (cur_s.median_price_per_m2 - prev_s.median_price_per_m2)
                / prev_s.median_price_per_m2 * 100,
                2,
            )

        out.append(
            AreaTrend(
                area_key=ak,
                sale_current=cur_s.median_price_per_m2 if cur_s else None,
                sale_previous=prev_s.median_price_per_m2 if prev_s else None,
                sale_trend_pct=trend,
                rent_current=cur_r.median_price_per_m2 if cur_r else None,
                rent_previous=None,
                sale_samples=cur_s.sample_count if cur_s else 0,
                p25_ppm2=cur_s.p25_price_per_m2 if cur_s else None,
                p75_ppm2=cur_s.p75_price_per_m2 if cur_s else None,
            )
        )
    return out


@router.get("/{area_key}/index", response_model=list[IndexPoint])
def area_index(
    area_key: str,
    listing_kind: ListingKind = ListingKind.sale,
    session: Session = Depends(get_session),
):
    stats = session.exec(
        select(AreaStat)
        .where(AreaStat.area_key == area_key.lower(), AreaStat.listing_kind == listing_kind)
        .order_by(AreaStat.period)
    ).all()
    base = next((s.median_price_per_m2 for s in stats if s.median_price_per_m2), None)
    points = []
    for s in stats:
        idx = (
            round(s.median_price_per_m2 / base * 100, 2)
            if base and s.median_price_per_m2
            else None
        )
        points.append(
            IndexPoint(
                period=s.period.isoformat(),
                median_price_per_m2=s.median_price_per_m2,
                index=idx,
                sample_count=s.sample_count,
            )
        )
    return points
