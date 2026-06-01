"""Idealista scraper — Spain (idealista.com) and Portugal (idealista.pt)."""
from __future__ import annotations

import json
import logging
import re
import unicodedata
from typing import Optional

from app.models import ListingKind, Portal, PropertyType, SavedSearch
from app.scrapers.base import BaseScraper, RawListing
from app.scrapers.jsonld import extract_jsonld_listings

logger = logging.getLogger(__name__)


def _slug(text: str) -> str:
    """Convert city name to Idealista URL slug."""
    text = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]+", "-", text.strip().lower()).strip("-")


def _parse_area(text: str) -> Optional[float]:
    """Parse '85 m²' or '85m2' → 85.0."""
    m = re.search(r"([\d.,]+)\s*m", text or "", re.I)
    if not m:
        return None
    return float(m.group(1).replace(".", "").replace(",", "."))


def _parse_price(text: str) -> Optional[float]:
    """Parse '450.000 €' or '€450,000' → 450000.0."""
    m = re.search(r"([\d.,]+)", re.sub(r"[^\d.,]", " ", text or "").strip())
    if not m:
        return None
    raw = m.group(1).replace(".", "").replace(",", "")
    try:
        return float(raw)
    except ValueError:
        return None


class IdealistaBaseScraper(BaseScraper):
    _base_domain: str = "idealista.com"

    def _sale_segment(self, search: SavedSearch) -> str:
        if search.listing_kind == ListingKind.rent:
            return "alquiler-viviendas" if self._base_domain == "idealista.com" else "arrendar-casas"
        return "venta-viviendas" if self._base_domain == "idealista.com" else "comprar-casas"

    def _build_url(self, search: SavedSearch, page: int = 1) -> str:
        slug = _slug(search.city or search.postal_code or "")
        segment = self._sale_segment(search)
        base = f"https://www.{self._base_domain}/{segment}/{slug}/"
        return base if page == 1 else f"{base}pagina-{page}.htm"

    def _parse_initial_props(self, html: str) -> list[dict]:
        """Extract adList from window.__INITIAL_PROPS__ JSON."""
        m = re.search(r"window\.__INITIAL_PROPS__\s*=\s*(\{.*?\});\s*</script>", html, re.S)
        if not m:
            return []
        try:
            data = json.loads(m.group(1))
            return data.get("adList", []) or []
        except (json.JSONDecodeError, AttributeError):
            return []

    def _raw_from_ad(self, ad: dict, search: SavedSearch) -> Optional[RawListing]:
        ext_id = str(ad.get("adId") or ad.get("id") or "")
        if not ext_id:
            return None
        url = ad.get("url") or ""
        if not url.startswith("http"):
            url = f"https://www.{self._base_domain}{url}"
        title = (ad.get("suggestedTexts") or {}).get("title") or ad.get("description") or ""
        price = None
        price_raw = ad.get("price")
        if price_raw is not None:
            try:
                price = float(price_raw)
            except (TypeError, ValueError):
                price = _parse_price(str(price_raw))
        area = None
        size_raw = ad.get("size") or ad.get("surface")
        if size_raw is not None:
            try:
                area = float(size_raw)
            except (TypeError, ValueError):
                area = _parse_area(str(size_raw))
        rooms = None
        rooms_raw = ad.get("rooms") or ad.get("bedrooms")
        if rooms_raw is not None:
            try:
                rooms = float(rooms_raw)
            except (TypeError, ValueError):
                pass
        address = ad.get("address") or ad.get("ubication") or ""
        postal_code = ad.get("postalCode") or search.postal_code
        city = ad.get("municipalityName") or ad.get("city") or search.city
        return RawListing(
            portal=self.portal,
            external_id=ext_id,
            url=url,
            title=title[:200],
            listing_kind=search.listing_kind,
            property_type=PropertyType.apartment,
            city=city or search.city,
            postal_code=postal_code,
            address=address,
            price=price,
            living_area_m2=area,
            rooms=rooms,
            currency="EUR",
        )

    def search(self, search: SavedSearch) -> list[RawListing]:
        from app.config import settings

        results: list[RawListing] = []
        for page in range(1, settings.max_pages_per_search + 1):
            url = self._build_url(search, page)
            html = self.fetch(url)
            if not html:
                break

            ads = self._parse_initial_props(html)
            if not ads:
                # Fallback: try JSON-LD
                jl = extract_jsonld_listings(html, self.portal, search.listing_kind)
                results.extend(jl)
                break

            page_results = []
            for ad in ads:
                raw = self._raw_from_ad(ad, search)
                if raw:
                    page_results.append(raw)
            results.extend(page_results)

            if len(page_results) < 30:  # last page
                break
        return results


class IdealistaESScraper(IdealistaBaseScraper):
    portal = Portal.idealista
    country = "es"
    _base_domain = "idealista.com"


class IdealistaPTScraper(IdealistaBaseScraper):
    portal = Portal.idealista_pt
    country = "pt"
    _base_domain = "idealista.pt"
