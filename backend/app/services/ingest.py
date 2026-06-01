from __future__ import annotations

import logging
from datetime import timedelta

from sqlmodel import Session, select

from app.models import Listing, ListingSnapshot, Portal, SavedSearch, utcnow
from app.scrapers.base import RawListing
from app.scrapers.registry import scrapers_for
from app.services.analysis import refresh_area_stats
from app.services.geocoder import geocode

logger = logging.getLogger(__name__)


def _matches_conditions(raw: RawListing, search: SavedSearch) -> bool:
    if search.price_min and (raw.price or 0) < search.price_min:
        return False
    if search.price_max and raw.price and raw.price > search.price_max:
        return False
    if search.size_min and (raw.living_area_m2 or 0) < search.size_min:
        return False
    if search.size_max and raw.living_area_m2 and raw.living_area_m2 > search.size_max:
        return False
    if search.rooms_min and (raw.rooms or 0) < search.rooms_min:
        return False
    if search.rooms_max and raw.rooms and raw.rooms > search.rooms_max:
        return False
    return True


def _upsert(session: Session, raw: RawListing, search: SavedSearch) -> None:
    existing = session.exec(
        select(Listing).where(
            Listing.portal == raw.portal, Listing.external_id == raw.external_id
        )
    ).first()
    now = utcnow()
    if existing:
        existing.price = raw.price
        existing.living_area_m2 = raw.living_area_m2
        existing.rooms = raw.rooms
        existing.price_per_m2 = raw.price_per_m2
        existing.last_seen_at = now
        existing.is_active = True
        if raw.postal_code:
            existing.postal_code = raw.postal_code
        if raw.city:
            existing.city = raw.city
        if existing.latitude is None:
            coords = geocode(existing.postal_code, existing.city, existing.country or "de")
            if coords:
                existing.latitude, existing.longitude = coords
        listing = existing
    else:
        postal = raw.postal_code or search.postal_code
        city = raw.city or search.city
        country = search.country or "de"
        coords = geocode(postal, city, country)
        listing = Listing(
            portal=raw.portal,
            external_id=raw.external_id,
            url=raw.url,
            title=raw.title,
            listing_kind=raw.listing_kind or search.listing_kind,
            property_type=raw.property_type or search.property_type,
            city=city,
            postal_code=postal,
            address=raw.address,
            price=raw.price,
            living_area_m2=raw.living_area_m2,
            rooms=raw.rooms,
            price_per_m2=raw.price_per_m2,
            currency=raw.currency,
            country=country,
            latitude=coords[0] if coords else None,
            longitude=coords[1] if coords else None,
        )
        session.add(listing)
    session.flush()  # ensure listing.id
    session.add(
        ListingSnapshot(
            listing_id=listing.id,
            price=raw.price,
            price_per_m2=raw.price_per_m2,
            is_active=True,
        )
    )


def ingest_search(session: Session, search: SavedSearch) -> dict:
    """Run all portals for one saved search; upsert + snapshot matching listings."""
    total, kept = 0, 0
    per_portal: dict[str, int] = {}
    for scraper in scrapers_for(search.country or "de"):
        try:
            raws = scraper.search(search)
        except Exception as exc:  # noqa: BLE001 - isolate portal failures
            logger.warning("Scraper %s failed for search %s: %s", scraper.portal, search.id, exc)
            per_portal[scraper.portal.value] = 0
            continue
        # ensure the listing kind reflects the search (rent vs sale)
        portal_kept = 0
        for raw in raws:
            raw.listing_kind = search.listing_kind
            total += 1
            if not _matches_conditions(raw, search):
                continue
            _upsert(session, raw, search)
            kept += 1
            portal_kept += 1
        per_portal[scraper.portal.value] = portal_kept
    session.commit()
    return {"search_id": search.id, "scraped": total, "kept": kept, "per_portal": per_portal}


def mark_stale(session: Session, days: int = 30) -> int:
    cutoff = utcnow() - timedelta(days=days)
    stale = session.exec(
        select(Listing).where(Listing.is_active, Listing.last_seen_at < cutoff)
    ).all()
    for ls in stale:
        ls.is_active = False
        session.add(ls)
    session.commit()
    return len(stale)


def run_all_active(session: Session) -> dict:
    searches = session.exec(select(SavedSearch).where(SavedSearch.active)).all()
    results = [ingest_search(session, s) for s in searches]
    mark_stale(session)
    areas = refresh_area_stats(session)
    return {"searches": len(results), "results": results, "areas_updated": areas}
