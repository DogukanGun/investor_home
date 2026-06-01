"""Rightmove scraper — United Kingdom (rightmove.co.uk)."""
from __future__ import annotations

import json
import logging
import re
import unicodedata
from typing import Optional

from app.models import ListingKind, Portal, PropertyType, SavedSearch
from app.scrapers.base import BaseScraper, RawListing

logger = logging.getLogger(__name__)

_BASE = "https://www.rightmove.co.uk"
_LOC_API = f"{_BASE}/house-prices/locations"


def _slug(text: str) -> str:
    text = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]+", "-", text.strip().lower()).strip("-")


def _parse_price(val) -> Optional[float]:
    if val is None:
        return None
    try:
        return float(val)
    except (TypeError, ValueError):
        m = re.search(r"([\d,]+)", str(val))
        if m:
            try:
                return float(m.group(1).replace(",", ""))
            except ValueError:
                pass
    return None


def _parse_area(text: str) -> Optional[float]:
    if not text:
        return None
    # Rightmove uses sq ft; convert to m² (1 sq ft = 0.0929 m²)
    m = re.search(r"([\d,]+)\s*sq\s*ft", str(text), re.I)
    if m:
        try:
            return round(float(m.group(1).replace(",", "")) * 0.0929, 1)
        except ValueError:
            pass
    # Try m²
    m = re.search(r"([\d.,]+)\s*m", str(text), re.I)
    if m:
        try:
            return float(m.group(1).replace(",", "."))
        except ValueError:
            pass
    return None


class RightmoveScraper(BaseScraper):
    portal = Portal.rightmove
    country = "gb"

    def _resolve_location_id(self, city: str) -> Optional[str]:
        """Resolve city name → Rightmove locationIdentifier (e.g. 'REGION^87490')."""
        try:
            html = self.fetch(_LOC_API, params={"term": city, "numberOfResults": 1})
            if not html:
                return None
            data = json.loads(html)
            suggestions = data.get("suggestions") or data.get("typeAheadLocations") or []
            if suggestions:
                ident = suggestions[0].get("locationIdentifier") or suggestions[0].get("identifier")
                if ident:
                    return str(ident)
        except Exception as exc:
            logger.debug("Rightmove location lookup for %r failed: %s", city, exc)
        return None

    def _build_url(self, search: SavedSearch, page: int = 1, location_id: Optional[str] = None) -> str:
        if search.listing_kind == ListingKind.rent:
            path = "/property-to-rent/find.html"
        else:
            path = "/property-for-sale/find.html"
        prop_types = "flat" if search.property_type == PropertyType.apartment else "detached,semi-detached,terraced"
        if location_id:
            loc = location_id
        else:
            loc = f"REGION^{_slug(search.city or search.postal_code or 'london')}"
        index = (page - 1) * 24
        return f"{_BASE}{path}?locationIdentifier={loc}&propertyTypes={prop_types}&index={index}&sortType=6"

    def _parse_json_model(self, html: str) -> list[dict]:
        """Extract properties from window.jsonModel embedded JSON."""
        m = re.search(r"window\.jsonModel\s*=\s*(\{.*?\});\s*(?:\n|</script>)", html, re.S)
        if not m:
            # Try alternate pattern
            m = re.search(r'"properties"\s*:\s*(\[.*?\])', html, re.S)
            if m:
                try:
                    return json.loads(m.group(1))
                except json.JSONDecodeError:
                    pass
            return []
        try:
            data = json.loads(m.group(1))
            return data.get("properties", [])
        except json.JSONDecodeError:
            return []

    def _raw_from_property(self, prop: dict, search: SavedSearch) -> Optional[RawListing]:
        ext_id = str(prop.get("id") or prop.get("propertyId") or "")
        if not ext_id:
            return None
        url_path = prop.get("propertyUrl") or f"/properties/{ext_id}"
        url = f"{_BASE}{url_path}" if not url_path.startswith("http") else url_path
        title = prop.get("displayAddress") or prop.get("address") or search.city
        price = None
        price_obj = prop.get("price") or {}
        if isinstance(price_obj, dict):
            price = _parse_price(price_obj.get("amount") or price_obj.get("displayPrices", [{}])[0].get("displayPrice"))
        else:
            price = _parse_price(price_obj)
        area_text = prop.get("displaySize") or prop.get("floorplanCount") or ""
        area = _parse_area(str(area_text))
        rooms = None
        for key in ("bedrooms", "numberOfBedrooms", "beds"):
            val = prop.get(key)
            if val is not None:
                try:
                    rooms = float(val)
                    break
                except (TypeError, ValueError):
                    pass
        location = prop.get("location") or {}
        postal = prop.get("postcode") or location.get("postcode") or search.postal_code
        city = search.city
        return RawListing(
            portal=self.portal,
            external_id=ext_id,
            url=url,
            title=str(title)[:200],
            listing_kind=search.listing_kind,
            property_type=search.property_type,
            city=city,
            postal_code=postal,
            price=price,
            living_area_m2=area,
            rooms=rooms,
            currency="GBP",
        )

    def search(self, search: SavedSearch) -> list[RawListing]:
        from app.config import settings

        location_id = self._resolve_location_id(search.city or "") if search.city else None
        results: list[RawListing] = []
        for page in range(1, settings.max_pages_per_search + 1):
            url = self._build_url(search, page, location_id)
            html = self.fetch(url)
            if not html:
                break
            props = self._parse_json_model(html)
            if not props:
                break
            page_results = [r for p in props if (r := self._raw_from_property(p, search))]
            results.extend(page_results)
            if len(page_results) < 24:
                break
        return results
