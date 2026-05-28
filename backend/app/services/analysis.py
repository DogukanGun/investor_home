from __future__ import annotations

import statistics
from datetime import date
from typing import Optional

from sqlmodel import Session, select

from app.config import settings
from app.models import AreaStat, Listing, ListingKind


def area_key_for(listing: Listing) -> str:
    """Group by postal code when present, else city (lowercased)."""
    return (listing.postal_code or listing.city or "unknown").strip().lower()


def percentile(values: list[float], pct: float) -> Optional[float]:
    if not values:
        return None
    s = sorted(values)
    if len(s) == 1:
        return s[0]
    k = (len(s) - 1) * pct
    lo = int(k)
    hi = min(lo + 1, len(s) - 1)
    return round(s[lo] + (s[hi] - s[lo]) * (k - lo), 2)


def undervaluation(listing_ppm2: Optional[float], area_median: Optional[float]) -> Optional[float]:
    """Positive => cheaper than area median => good price."""
    if not listing_ppm2 or not area_median:
        return None
    return round((area_median - listing_ppm2) / area_median, 4)


def deal_rating(under: Optional[float]) -> str:
    if under is None:
        return "unknown"
    if under >= settings.good_deal_threshold:
        return "good"
    if under <= settings.overpriced_threshold:
        return "overpriced"
    return "fair"


def gross_rental_yield(
    purchase_price: Optional[float],
    living_area_m2: Optional[float],
    rent_ppm2_month: Optional[float],
) -> Optional[float]:
    """Annual rent / purchase price, using area rent €/m²/month."""
    if not purchase_price or not living_area_m2 or not rent_ppm2_month:
        return None
    annual_rent = rent_ppm2_month * living_area_m2 * 12
    return round(annual_rent / purchase_price, 4)


# ---------------------------------------------------------------------------
# AreaStat refresh (materialize today's aggregates from active listings)
# ---------------------------------------------------------------------------
def refresh_area_stats(session: Session, period: Optional[date] = None) -> int:
    period = period or date.today()
    listings = session.exec(select(Listing).where(Listing.is_active)).all()

    buckets: dict[tuple[str, ListingKind], list[float]] = {}
    for ls in listings:
        if not ls.price_per_m2:
            continue
        buckets.setdefault((area_key_for(ls), ls.listing_kind), []).append(ls.price_per_m2)

    count = 0
    for (area_key, kind), ppms in buckets.items():
        existing = session.exec(
            select(AreaStat).where(
                AreaStat.area_key == area_key,
                AreaStat.listing_kind == kind,
                AreaStat.period == period,
            )
        ).first()
        stat = existing or AreaStat(area_key=area_key, listing_kind=kind, period=period)
        stat.sample_count = len(ppms)
        stat.median_price_per_m2 = round(statistics.median(ppms), 2)
        stat.avg_price_per_m2 = round(statistics.fmean(ppms), 2)
        stat.p25_price_per_m2 = percentile(ppms, 0.25)
        stat.p75_price_per_m2 = percentile(ppms, 0.75)
        session.add(stat)
        count += 1
    session.commit()
    return count


def latest_area_median(
    session: Session, area_key: str, kind: ListingKind
) -> Optional[float]:
    stat = session.exec(
        select(AreaStat)
        .where(AreaStat.area_key == area_key, AreaStat.listing_kind == kind)
        .order_by(AreaStat.period.desc())
    ).first()
    return stat.median_price_per_m2 if stat else None
