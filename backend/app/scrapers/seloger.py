"""SeLoger scraper — France (seloger.com)."""
from __future__ import annotations

import json
import logging
import re
from typing import Optional

from app.models import ListingKind, Portal, PropertyType, SavedSearch
from app.scrapers.base import BaseScraper, RawListing

logger = logging.getLogger(__name__)

_BASE = "https://www.seloger.com"
_LOC_API = "https://api.seloger.com/api/l2/locations"

# SeLoger type codes: 1=apartment, 2=house
_PROP_TYPE = {PropertyType.apartment: 1, PropertyType.house: 2}
# Project codes: 1=sale (achat), 2=rent (location)
_PROJECT = {ListingKind.sale: 1, ListingKind.rent: 2}


def _parse_price(text: str) -> Optional[float]:
    m = re.search(r"([\d\s]+)", re.sub(r"[^\d\s]", " ", str(text or "")).strip())
    if not m:
        return None
    try:
        return float(m.group(1).replace(" ", ""))
    except ValueError:
        return None


def _parse_area(text: str) -> Optional[float]:
    m = re.search(r"([\d.,]+)\s*m", str(text or ""), re.I)
    if not m:
        return None
    try:
        return float(m.group(1).replace(",", "."))
    except ValueError:
        return None


class SeLogerScraper(BaseScraper):
    portal = Portal.seloger
    country = "fr"

    def _resolve_city_id(self, city: str) -> Optional[str]:
        """Resolve city name → SeLoger place ID via location API."""
        try:
            html = self.fetch(_LOC_API, params={"q": city, "lang": "fr"})
            if not html:
                return None
            data = json.loads(html)
            items = data if isinstance(data, list) else data.get("suggestions") or data.get("items") or []
            if items:
                # Return the inseeCode or id of the first match
                first = items[0]
                return str(first.get("inseeCode") or first.get("id") or "")
        except Exception as exc:
            logger.debug("SeLoger city lookup for %r failed: %s", city, exc)
        return None

    def _build_url(self, search: SavedSearch, page: int = 1, city_id: Optional[str] = None) -> str:
        prop_type = _PROP_TYPE.get(search.property_type, 1)
        project = _PROJECT.get(search.listing_kind, 1)
        if city_id:
            places = f"[{{ci:{city_id}}}]"
        else:
            places = f"[{{cp:{search.postal_code or ''}}}]" if search.postal_code else ""
        params = f"types={prop_type}&projects={project}"
        if places:
            params += f"&places={places}"
        url = f"{_BASE}/list.htm?{params}"
        if page > 1:
            url += f"&LISTING-LISTpg={page}"
        return url

    def _parse_next_data(self, html: str) -> list[dict]:
        """Extract listings from Next.js __NEXT_DATA__ JSON."""
        m = re.search(r'<script id="__NEXT_DATA__"[^>]*>(.*?)</script>', html, re.S)
        if not m:
            return []
        try:
            data = json.loads(m.group(1))
            page_props = data.get("props", {}).get("pageProps", {})
            # Try multiple known paths
            for path in [["listings", "ads"], ["initialProps", "listings", "ads"], ["ads"]]:
                node = page_props
                for key in path:
                    node = node.get(key) if isinstance(node, dict) else None
                    if node is None:
                        break
                if isinstance(node, list):
                    return node
        except (json.JSONDecodeError, AttributeError):
            pass
        return []

    def _raw_from_ad(self, ad: dict, search: SavedSearch) -> Optional[RawListing]:
        ext_id = str(ad.get("idAnnonce") or ad.get("id") or "")
        if not ext_id:
            return None
        permalink = ad.get("permalink") or ad.get("url") or ""
        if not permalink.startswith("http"):
            permalink = f"{_BASE}{permalink}"
        title = ad.get("title") or ad.get("titre") or ""
        price = None
        for key in ("prix", "price", "prixAffiche"):
            val = ad.get(key)
            if val is not None:
                price = _parse_price(str(val))
                if price:
                    break
        area = None
        for key in ("surface", "surfaceArea", "livingArea"):
            val = ad.get(key)
            if val is not None:
                try:
                    area = float(val)
                except (TypeError, ValueError):
                    area = _parse_area(str(val))
                if area:
                    break
        rooms = None
        for key in ("nbPieces", "rooms", "bedrooms"):
            val = ad.get(key)
            if val is not None:
                try:
                    rooms = float(val)
                    break
                except (TypeError, ValueError):
                    pass
        city = ad.get("city") or ad.get("ville") or search.city
        postal = ad.get("postalCode") or ad.get("codePostal") or search.postal_code
        return RawListing(
            portal=self.portal,
            external_id=ext_id,
            url=permalink,
            title=str(title)[:200],
            listing_kind=search.listing_kind,
            property_type=search.property_type,
            city=city,
            postal_code=str(postal) if postal else None,
            price=price,
            living_area_m2=area,
            rooms=rooms,
            currency="EUR",
        )

    def search(self, search: SavedSearch) -> list[RawListing]:
        from app.config import settings

        city_id = self._resolve_city_id(search.city) if search.city else None
        results: list[RawListing] = []
        for page in range(1, settings.max_pages_per_search + 1):
            url = self._build_url(search, page, city_id)
            html = self.fetch(url)
            if not html:
                break
            ads = self._parse_next_data(html)
            if not ads:
                break
            page_results = [r for ad in ads if (r := self._raw_from_ad(ad, search))]
            results.extend(page_results)
            if len(page_results) < 10:
                break
        return results
