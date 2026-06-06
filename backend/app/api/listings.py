from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlmodel import Session, select

from app.db import get_session
from app.models import Listing, ListingKind, Portal, PropertyType
from app.services.analysis import (
    area_key_for,
    deal_rating,
    gross_rental_yield,
    latest_area_median,
    undervaluation,
)
from app.services.geo import within_radius
from app.services.geocoder import geocode

router = APIRouter(prefix="/api/listings", tags=["listings"])


class ListingOut(BaseModel):
    id: int
    portal: Portal
    url: str
    title: str
    listing_kind: ListingKind
    property_type: Optional[PropertyType]
    city: str
    postal_code: Optional[str]
    price: Optional[float]
    living_area_m2: Optional[float]
    rooms: Optional[float]
    price_per_m2: Optional[float]
    area_median_ppm2: Optional[float]
    undervaluation: Optional[float]
    deal_rating: str
    gross_yield: Optional[float]
    last_seen_at: str
    currency: str
    country: str
    latitude: Optional[float]
    longitude: Optional[float]


@router.get("", response_model=list[ListingOut])
def list_listings(
    session: Session = Depends(get_session),
    city: Optional[str] = None,
    postal_code: Optional[str] = None,
    radius_km: Optional[float] = None,
    portal: Optional[Portal] = None,
    listing_kind: ListingKind = ListingKind.sale,
    property_type: Optional[PropertyType] = None,
    price_min: Optional[float] = None,
    price_max: Optional[float] = None,
    country: Optional[str] = None,
    rating: Optional[str] = None,
    sort: str = Query("undervaluation", pattern="^(undervaluation|price|price_per_m2|yield)$"),
    limit: int = 200,
):
    # Determine if we should use radius-based filtering
    center_coords: Optional[tuple[float, float]] = None
    use_radius = postal_code and radius_km is not None and radius_km > 0
    if use_radius:
        center_coords = geocode(postal_code, city, country or "de")
        if center_coords is None:
            # Geocoder failed: fall back to exact postal_code match
            use_radius = False

    stmt = select(Listing).where(Listing.is_active, Listing.listing_kind == listing_kind)
    if country:
        stmt = stmt.where(Listing.country == country)
    if city:
        stmt = stmt.where(Listing.city.ilike(f"%{city}%"))
    if postal_code and not use_radius:
        # Exact postal code match (when radius is not being used)
        stmt = stmt.where(Listing.postal_code == postal_code)
    if portal:
        stmt = stmt.where(Listing.portal == portal)
    if property_type:
        stmt = stmt.where(Listing.property_type == property_type)
    if price_min:
        stmt = stmt.where(Listing.price >= price_min)
    if price_max:
        stmt = stmt.where(Listing.price <= price_max)

    listings = session.exec(stmt).all()
    out: list[ListingOut] = []
    for ls in listings:
        # Apply radius filter if enabled
        if use_radius and center_coords:
            if not within_radius(center_coords[0], center_coords[1],
                                ls.latitude, ls.longitude, radius_km):
                continue
        ak = area_key_for(ls)
        median = latest_area_median(session, ak, ls.listing_kind)
        under = undervaluation(ls.price_per_m2, median)
        rent_ppm2 = latest_area_median(session, ak, ListingKind.rent)
        yld = (
            gross_rental_yield(ls.price, ls.living_area_m2, rent_ppm2)
            if ls.listing_kind == ListingKind.sale
            else None
        )
        rate = deal_rating(under)
        if rating and rate != rating:
            continue
        out.append(
            ListingOut(
                id=ls.id,
                portal=ls.portal,
                url=ls.url,
                title=ls.title,
                listing_kind=ls.listing_kind,
                property_type=ls.property_type,
                city=ls.city,
                postal_code=ls.postal_code,
                price=ls.price,
                living_area_m2=ls.living_area_m2,
                rooms=ls.rooms,
                price_per_m2=ls.price_per_m2,
                area_median_ppm2=median,
                undervaluation=under,
                deal_rating=rate,
                gross_yield=yld,
                last_seen_at=ls.last_seen_at.isoformat(),
                currency=ls.currency or "EUR",
                country=ls.country or "de",
                latitude=ls.latitude,
                longitude=ls.longitude,
            )
        )

    descending = sort in ("undervaluation", "yield")

    def key(o: ListingOut):
        val = {
            "undervaluation": o.undervaluation,
            "price": o.price,
            "price_per_m2": o.price_per_m2,
            "yield": o.gross_yield,
        }[sort]
        if val is None:
            return (1, 0.0)  # always last
        return (0, -val if descending else val)

    out.sort(key=key)
    return out[:limit]
