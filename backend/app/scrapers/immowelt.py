from __future__ import annotations

import logging
import re

from selectolax.parser import HTMLParser, Node

from app.config import settings
from app.models import ListingKind, Portal, PropertyType, SavedSearch
from app.scrapers.base import BaseScraper, RawListing
from app.scrapers.jsonld import extract_jsonld_listings
from app.scrapers.parse import parse_german_number, parse_postal_city

logger = logging.getLogger(__name__)

BASE = "https://www.immowelt.de"


def _external_id(url: str) -> str:
    return url.rstrip("/").split("/")[-1].split("?")[0] or url


class ImmoweltScraper(BaseScraper):
    portal = Portal.immowelt

    def build_url(self, search: SavedSearch) -> str:
        kind = "kaufen" if search.listing_kind == ListingKind.sale else "mieten"
        estate = "wohnungen" if search.property_type == PropertyType.apartment else "haeuser"
        loc = (search.city or search.postal_code or "").strip().lower().replace(" ", "-")
        return f"{BASE}/liste/{loc}/{estate}/{kind}"

    def search(self, search: SavedSearch) -> list[RawListing]:
        url = self.build_url(search)
        results: list[RawListing] = []
        for page in range(1, 1 + max(1, settings.max_pages_per_search)):
            html = self.fetch(url, params={"sp": page} if page > 1 else None)
            if not html:
                break
            page_results = self.parse_listings(html)
            if not page_results:
                break
            results.extend(page_results)
        return results

    def parse_listings(self, html: str) -> list[RawListing]:
        # 1) Real SERP cards (current immowelt.de markup)
        cards = self._from_serp_cards(html)
        if cards:
            return cards
        # 2) JSON-LD (some pages / fixtures)
        items = extract_jsonld_listings(html, self.portal, BASE)
        if items:
            return items
        # 3) Generic anchor fallback
        return self._from_anchors(html)

    def _from_serp_cards(self, html: str) -> list[RawListing]:
        tree = HTMLParser(html)
        out: list[RawListing] = []
        seen: set[str] = set()
        for price_node in tree.css('[data-testid="cardmfe-price-testid"]'):
            card = _ancestor_with_expose(price_node)
            if not card:
                continue
            link = card.css_first('a[href*="/expose/"]')
            href = link.attributes.get("href") if link else None
            if not href:
                continue
            url = href if href.startswith("http") else f"{BASE}{href}"
            ext = _external_id(url)
            if ext in seen:
                continue
            seen.add(ext)

            price = parse_german_number(price_node.text(strip=True))
            rooms = area = None
            kf = card.css_first('[data-testid="cardmfe-keyfacts-testid"]')
            if kf:
                text = kf.text(separator=" ", strip=True)
                rm = re.search(r"([\d.,]+)\s*Zimmer", text)
                am = re.search(r"([\d.,]+)\s*m²", text)
                rooms = parse_german_number(rm.group(1)) if rm else None
                area = parse_german_number(am.group(1)) if am else None
            postal = city = None
            addr_node = card.css_first('[data-testid="cardmfe-description-box-address"]')
            address = addr_node.text(strip=True) if addr_node else None
            if address:
                postal, city = parse_postal_city_immowelt(address)

            title_node = card.css_first('[data-testid="cardmfe-description-box-text-test-id"]')
            title = title_node.text(strip=True) if title_node else ""
            if not title or "€" in title:
                title = address or title

            out.append(
                RawListing(
                    portal=self.portal,
                    external_id=ext,
                    url=url,
                    title=title[:120],
                    price=price,
                    living_area_m2=area,
                    rooms=rooms,
                    postal_code=postal,
                    city=city or "",
                    address=address,
                )
            )
        return out

    def _from_anchors(self, html: str) -> list[RawListing]:
        tree = HTMLParser(html)
        out: list[RawListing] = []
        seen: set[str] = set()
        for a in tree.css("a[href*='/expose/']"):
            href = a.attributes.get("href", "")
            if not href:
                continue
            url = href if href.startswith("http") else f"{BASE}{href}"
            ext = _external_id(url)
            if ext in seen:
                continue
            seen.add(ext)
            text = a.text(separator=" ", strip=True)
            price = next((parse_german_number(s) for s in re.findall(r"[\d.]+\s*€", text)), None)
            area = next((parse_german_number(s) for s in re.findall(r"[\d.,]+\s*m²", text)), None)
            out.append(
                RawListing(
                    portal=self.portal,
                    external_id=ext,
                    url=url,
                    title=text[:120],
                    price=price,
                    living_area_m2=area,
                )
            )
        return out


def _ancestor_with_expose(node: Node, max_depth: int = 12) -> Node | None:
    cur = node
    depth = 0
    while cur is not None and depth < max_depth:
        if cur.css_first('a[href*="/expose/"]'):
            return cur
        cur = cur.parent
        depth += 1
    return None


def parse_postal_city_immowelt(address: str) -> tuple[str | None, str | None]:
    """Immowelt address form: 'Street, District, City (04275)'."""
    m = re.search(r"\((\d{5})\)", address)
    postal = m.group(1) if m else None
    city = None
    if m:
        before = address[: m.start()].strip().rstrip(",")
        city = before.split(",")[-1].strip() or None
    if not postal:
        postal, city = parse_postal_city(address)
    return postal, city
