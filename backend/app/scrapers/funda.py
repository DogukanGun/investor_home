"""Funda scraper — Netherlands (funda.nl)."""
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

_BASE = "https://www.funda.nl"


def _slug(text: str) -> str:
    text = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]+", "-", text.strip().lower()).strip("-")


def _parse_dutch_price(text: str) -> Optional[float]:
    """Parse '€ 450.000 k.k.' or '450.000' → 450000.0."""
    digits = re.sub(r"[^\d]", "", re.sub(r"\.", "", str(text or "")))
    try:
        return float(digits) if digits else None
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


class FundaScraper(BaseScraper):
    portal = Portal.funda
    country = "nl"

    def _build_url(self, search: SavedSearch, page: int = 1) -> str:
        segment = "koop" if search.listing_kind == ListingKind.sale else "huur"
        slug = _slug(search.postal_code or search.city or "")
        url = f"{_BASE}/{segment}/{slug}/"
        if page > 1:
            url += f"?search_result={page}"
        return url

    def _parse_next_data(self, html: str) -> list[dict]:
        """Extract from Next.js __NEXT_DATA__ — Funda is a Next.js app."""
        m = re.search(r'<script id="__NEXT_DATA__"[^>]*>(.*?)</script>', html, re.S)
        if not m:
            return []
        try:
            data = json.loads(m.group(1))
            props = data.get("props", {}).get("pageProps", {})
            # Try common Funda data paths
            for key in ["searchResult", "listings", "objects", "results"]:
                node = props.get(key)
                if isinstance(node, list):
                    return node
                if isinstance(node, dict):
                    for sub in ["hits", "objects", "results", "items"]:
                        lst = node.get(sub)
                        if isinstance(lst, list):
                            return lst
        except (json.JSONDecodeError, AttributeError):
            pass
        return []

    def _parse_cards(self, html: str, search: SavedSearch) -> list[RawListing]:
        """Fallback: parse listing cards from HTML."""
        from selectolax.parser import HTMLParser

        tree = HTMLParser(html)
        results = []
        # Funda listing cards have data-test-id or data-object-url attributes
        for card in tree.css("[data-test-id='search-result-item'], [data-object-url]"):
            link = card.css_first("a[href*='/koop/'], a[href*='/huur/'], a[data-object-url]")
            if not link:
                continue
            href = link.attrs.get("href") or link.attrs.get("data-object-url") or ""
            if not href.startswith("http"):
                href = f"{_BASE}{href}"
            # Extract ID from URL slug
            ext_id = href.rstrip("/").split("/")[-1] or href
            # Price
            price_el = card.css_first("[class*='price'], [data-test-id*='price']")
            price = _parse_dutch_price(price_el.text(strip=True) if price_el else "")
            # Area
            area_el = card.css_first("[class*='surface'], [class*='area'], [title*='m²']")
            area = _parse_area(area_el.text(strip=True) if area_el else "")
            # Rooms
            rooms_el = card.css_first("[class*='rooms'], [class*='bedroom'], [title*='kamer']")
            rooms = None
            if rooms_el:
                m = re.search(r"(\d+)", rooms_el.text(strip=True))
                if m:
                    rooms = float(m.group(1))
            # Title
            title_el = card.css_first("h2, [class*='address'], [class*='title']")
            title = title_el.text(strip=True) if title_el else ""
            results.append(
                RawListing(
                    portal=self.portal,
                    external_id=str(ext_id),
                    url=href,
                    title=title[:200],
                    listing_kind=search.listing_kind,
                    property_type=search.property_type,
                    city=search.city,
                    postal_code=search.postal_code,
                    price=price,
                    living_area_m2=area,
                    rooms=rooms,
                    currency="EUR",
                )
            )
        return results

    def _raw_from_obj(self, obj: dict, search: SavedSearch) -> Optional[RawListing]:
        ext_id = str(obj.get("Id") or obj.get("id") or obj.get("globalId") or "")
        if not ext_id:
            return None
        url = obj.get("Url") or obj.get("url") or obj.get("detailPageUrl") or ""
        if url and not url.startswith("http"):
            url = f"{_BASE}{url}"
        title = obj.get("Address") or obj.get("address") or obj.get("title") or search.city
        price = None
        for key in ("Price", "price", "listingPrice", "koopprijs"):
            val = obj.get(key)
            if val is not None:
                try:
                    price = float(val)
                except (TypeError, ValueError):
                    price = _parse_dutch_price(str(val))
                if price:
                    break
        area = None
        for key in ("LivingArea", "livingArea", "usableArea", "oppervlakte"):
            val = obj.get(key)
            if val is not None:
                try:
                    area = float(val)
                except (TypeError, ValueError):
                    area = _parse_area(str(val))
                if area:
                    break
        rooms = None
        for key in ("NumberOfRooms", "numberOfRooms", "rooms", "numberOfBedrooms"):
            val = obj.get(key)
            if val is not None:
                try:
                    rooms = float(val)
                    break
                except (TypeError, ValueError):
                    pass
        postal = obj.get("PostalCode") or obj.get("postalCode") or search.postal_code
        city = obj.get("City") or obj.get("city") or search.city
        return RawListing(
            portal=self.portal,
            external_id=ext_id,
            url=url,
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

        results: list[RawListing] = []
        for page in range(1, settings.max_pages_per_search + 1):
            url = self._build_url(search, page)
            html = self.fetch(url)
            if not html:
                break

            objs = self._parse_next_data(html)
            if objs:
                page_results = [r for o in objs if (r := self._raw_from_obj(o, search))]
            else:
                # Fallback to JSON-LD, then card parsing
                page_results = extract_jsonld_listings(html, self.portal, search.listing_kind)
                if not page_results:
                    page_results = self._parse_cards(html, search)

            results.extend(page_results)
            if len(page_results) < 10:
                break
        return results
