"""Nominatim geocoder with in-process cache and 1 req/sec throttle."""
from __future__ import annotations

import logging
import time
from typing import Optional

import httpx

logger = logging.getLogger(__name__)

_NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"
_HEADERS = {
    "User-Agent": "InvestorHome/0.1 (European real-estate research tool; tools@certhub.de)"
}

COUNTRY_NAMES: dict[str, str] = {
    "de": "Deutschland",
    "es": "España",
    "pt": "Portugal",
    "fr": "France",
    "nl": "Nederland",
    "gb": "United Kingdom",
}

# In-process cache: "{country}:{postal_or_city}" -> (lat, lon) or None
_cache: dict[str, Optional[tuple[float, float]]] = {}
_last_request: float = 0.0


def _throttle() -> None:
    global _last_request
    elapsed = time.monotonic() - _last_request
    if elapsed < 1.0:
        time.sleep(1.0 - elapsed)
    _last_request = time.monotonic()


def geocode(
    postal_code: Optional[str],
    city: Optional[str] = None,
    country: str = "de",
) -> Optional[tuple[float, float]]:
    """Return (lat, lon) for a postal code/city + country, or None on failure."""
    loc = (postal_code or "").strip() or (city or "").strip().lower()
    if not loc:
        return None
    cache_key = f"{country}:{loc}"
    if cache_key in _cache:
        return _cache[cache_key]

    country_name = COUNTRY_NAMES.get(country, "")
    query = f"{loc}, {country_name}" if country_name else loc
    _throttle()
    try:
        resp = httpx.get(
            _NOMINATIM_URL,
            params={"q": query, "format": "json", "limit": 1, "countrycodes": country},
            headers=_HEADERS,
            timeout=10.0,
        )
        data = resp.json()
        if data:
            result: tuple[float, float] = (float(data[0]["lat"]), float(data[0]["lon"]))
            _cache[cache_key] = result
            return result
    except Exception as exc:
        logger.warning("Nominatim lookup failed for %r (%s): %s", loc, country, exc)
    _cache[cache_key] = None
    return None


def warm_cache_from_db(session) -> None:
    """Pre-populate cache from listings that already have coordinates."""
    from sqlmodel import select

    from app.models import Listing

    rows = session.exec(
        select(
            Listing.postal_code,
            Listing.city,
            Listing.country,
            Listing.latitude,
            Listing.longitude,
        ).where(Listing.latitude.is_not(None))
    ).all()
    for postal_code, city, ctry, lat, lon in rows:
        loc = (postal_code or "").strip() or (city or "").strip().lower()
        key = f"{ctry or 'de'}:{loc}"
        if key and lat is not None and lon is not None:
            _cache.setdefault(key, (lat, lon))
