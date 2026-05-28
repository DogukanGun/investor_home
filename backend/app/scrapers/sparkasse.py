from __future__ import annotations

import logging
import re

import httpx

from app.config import settings
from app.models import ListingKind, Portal, PropertyType, SavedSearch
from app.scrapers.base import BaseScraper, RawListing

logger = logging.getLogger(__name__)

BASE = "https://immobilien.sparkasse.de"
API = f"{BASE}/api/immobilien-api/estates"
PAGE_SIZE = 25

# offerType in the Sparkasse API: 2 = buy, 3 = rent
OFFER_TYPE = {ListingKind.sale: 2, ListingKind.rent: 3}
# estate objectType -> our PropertyType
OBJECT_TYPE = {PropertyType.apartment: "flat", PropertyType.house: "house"}


class SparkasseScraper(BaseScraper):
    """Sparkasse Immobilien exposes a clean JSON API (no bot wall).

    Endpoint: /api/immobilien-api/estates?regionalSearch=<plz|city>&offerType=<2|3>&page=&pageSize=
    regionalSearch accepts a postal code, which lets us target a single PLZ.
    """

    portal = Portal.sparkasse

    def fetch_json(self, params: dict) -> dict | None:
        for attempt in range(1, settings.max_retries + 1):
            self._throttle()
            try:
                resp = httpx.get(
                    API,
                    params=params,
                    headers={**self._headers(), "Accept": "application/json"},
                    timeout=settings.request_timeout_s,
                    follow_redirects=True,
                )
                if resp.status_code == 200:
                    return resp.json()
                logger.warning("sparkasse %s -> %s (attempt %d)", params, resp.status_code, attempt)
            except (httpx.HTTPError, ValueError) as exc:
                logger.warning("sparkasse request failed: %s (attempt %d)", exc, attempt)
        return None

    def search(self, search: SavedSearch) -> list[RawListing]:
        region = (search.postal_code or search.city or "").strip()
        if not region:
            return []
        want_object = OBJECT_TYPE.get(search.property_type)
        searched_postal = region if re.fullmatch(r"\d{5}", region) else None
        results: list[RawListing] = []
        for page in range(1, 1 + max(1, settings.max_pages_per_search)):
            data = self.fetch_json(
                {
                    "regionalSearch": region,
                    "offerType": OFFER_TYPE[search.listing_kind],
                    "page": page,
                    "pageSize": PAGE_SIZE,
                }
            )
            if not data:
                break
            estates = data.get("estates", [])
            if not estates:
                break
            for e in estates:
                rl = self._to_raw(e, searched_postal, search.city)
                if rl and (not want_object or e.get("objectType") == want_object):
                    results.append(rl)
            if page >= data.get("pageCount", page):
                break
        return results

    def _to_raw(self, e: dict, postal: str | None, fallback_city: str) -> RawListing | None:
        ext = e.get("id")
        if not ext:
            return None
        # The API's mainFacts `numeric` drops decimals (e.g. "2.5" rooms -> 25),
        # so parse the human `value` string instead.
        facts = {f.get("name"): _decimal(f.get("value")) for f in e.get("mainFacts", [])}
        price = (e.get("priceData") or {}).get("numeric")
        return RawListing(
            portal=self.portal,
            external_id=str(ext),
            url=f"{BASE}/expose/{ext}.html",
            title=(e.get("title") or "").strip()[:120],
            price=float(price) if price else None,
            living_area_m2=facts.get("livingSpace"),
            rooms=facts.get("roomNumber"),
            postal_code=postal,
            city=(e.get("subtitle") or fallback_city or "").strip(),
        )


def _decimal(value: str | None) -> float | None:
    """Parse a fact value like '74 m²' or '2,5' or '2.5' to a float.

    These values carry no thousands separators, so both '.' and ',' are decimals.
    """
    if not value:
        return None
    m = re.search(r"\d+(?:[.,]\d+)?", str(value))
    if not m:
        return None
    return float(m.group(0).replace(",", "."))
