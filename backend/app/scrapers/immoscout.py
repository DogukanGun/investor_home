from __future__ import annotations

import json
import logging
import random
import re
from functools import lru_cache
from typing import Optional

import httpx

from app.config import settings
from app.models import ListingKind, Portal, PropertyType, SavedSearch
from app.scrapers.base import USER_AGENTS, BaseScraper, RawListing
from app.scrapers.jsonld import extract_jsonld_listings
from app.scrapers.parse import parse_german_number, parse_postal_city

logger = logging.getLogger(__name__)

BASE = "https://www.immobilienscout24.de"

_STEALTH_JS = """
Object.defineProperty(navigator,'webdriver',{get:()=>undefined});
Object.defineProperty(navigator,'languages',{get:()=>['de-DE','de','en']});
Object.defineProperty(navigator,'plugins',{get:()=>[1,2,3,4,5]});
window.chrome={runtime:{}};
"""

_BOT_WALL_MARKERS = ("ich bin kein roboter", "captcha", "datadome", "px-captcha")


def _is_bot_wall(html: str) -> bool:
    low = html.lower()
    return len(html) < 8000 and any(m in low for m in _BOT_WALL_MARKERS)


class ImmoScoutScraper(BaseScraper):
    """ImmoScout24 is protected by DataDome.

    Primary engine is Camoufox (patched real-Firefox build, near-zero headless
    detection); falls back to stealth Playwright if Camoufox is unavailable.
    """

    portal = Portal.immoscout

    def build_url(self, search: SavedSearch) -> str:
        kind = "wohnung-kaufen" if search.listing_kind == ListingKind.sale else "wohnung-mieten"
        if search.property_type == PropertyType.house:
            kind = "haus-kaufen" if search.listing_kind == ListingKind.sale else "haus-mieten"
        # Resolve a real IS24 geopath (e.g. /de/bayern/muenchen) via the public
        # geoautocomplete endpoint, which is not behind DataDome.
        geopath = _resolve_geopath(search.city or search.postal_code or "")
        if geopath:
            return f"{BASE}/Suche{geopath}/{kind}"
        loc = (search.city or search.postal_code or "").strip().lower().replace(" ", "-")
        return f"{BASE}/Suche/de/{loc}/{kind}"

    def search(self, search: SavedSearch) -> list[RawListing]:
        if settings.is24_engine == "off":
            logger.info("ImmoScout engine disabled (is24_engine=off); skipping.")
            return []
        url = self.build_url(search)
        html = self.render(url)
        if not html:
            return []
        return self.parse_listings(html)

    def render(self, url: str) -> Optional[str]:
        self._throttle()
        if settings.is24_engine == "camoufox":
            html = self._render_camoufox(url)
            if html is not None:
                return html
            logger.info("Camoufox unavailable/failed; falling back to stealth Playwright.")
        return self._render_playwright(url)

    # -- Camoufox (primary) -------------------------------------------------
    def _render_camoufox(self, url: str) -> Optional[str]:
        try:
            from camoufox.sync_api import Camoufox
        except ImportError:
            logger.warning("camoufox not installed; run `pip install camoufox[geoip]` + `camoufox fetch`.")
            return None
        proxy = {"server": settings.is24_proxy} if settings.is24_proxy else None
        try:
            with Camoufox(
                headless=settings.is24_headless,
                humanize=True,
                geoip=True,
                locale="de-DE",
                proxy=proxy,
            ) as browser:
                page = browser.new_page()
                page.goto(url, timeout=int(settings.request_timeout_s * 1000), wait_until="domcontentloaded")
                self._simulate(page)
                html = page.content()
            return self._guard(html)
        except Exception as exc:  # noqa: BLE001 - isolate portal failures
            logger.warning("ImmoScout Camoufox render failed: %s", exc)
            return None

    # -- stealth Playwright (fallback) --------------------------------------
    def _render_playwright(self, url: str) -> Optional[str]:
        try:
            from playwright.sync_api import sync_playwright
        except ImportError:
            logger.warning("Playwright not installed; skipping ImmoScout.")
            return None
        try:
            with sync_playwright() as p:
                browser = p.chromium.launch(
                    headless=settings.is24_headless,
                    args=["--disable-blink-features=AutomationControlled", "--no-sandbox"],
                )
                ctx = browser.new_context(
                    user_agent=self._headers()["User-Agent"],
                    locale="de-DE",
                    viewport={"width": 1440, "height": 900},
                    extra_http_headers={"Accept-Language": "de-DE,de;q=0.9"},
                    proxy={"server": settings.is24_proxy} if settings.is24_proxy else None,
                )
                ctx.add_init_script(_STEALTH_JS)
                page = ctx.new_page()
                page.goto(url, timeout=int(settings.request_timeout_s * 1000), wait_until="domcontentloaded")
                self._simulate(page)
                html = page.content()
                browser.close()
            return self._guard(html)
        except Exception as exc:  # noqa: BLE001 - isolate portal failures
            logger.warning("ImmoScout Playwright render failed: %s", exc)
            return None

    def _simulate(self, page) -> None:
        """Light behavioural simulation to look human while the JS challenge clears."""
        page.wait_for_timeout(random.randint(2500, 4500))
        for _ in range(random.randint(1, 3)):
            page.mouse.wheel(0, random.randint(600, 1400))
            page.wait_for_timeout(random.randint(400, 1200))
        page.wait_for_timeout(random.randint(800, 1600))

    def _guard(self, html: str) -> Optional[str]:
        if _is_bot_wall(html):
            logger.warning(
                "ImmoScout still served a DataDome challenge. The browser fingerprint passed "
                "but this IP is likely flagged. Set INVESTORHOME_IS24_PROXY to a residential "
                "proxy to get through. Skipping ImmoScout for now."
            )
            return None
        return html

    def parse_listings(self, html: str) -> list[RawListing]:
        # Prefer IS24's embedded result JSON (has price/area/rooms);
        # JSON-LD is a fallback (it lacks per-listing price).
        items = self._from_result_json(html)
        if items:
            return items
        return extract_jsonld_listings(html, self.portal, BASE)

    def _from_result_json(self, html: str) -> list[RawListing]:
        """Parse the embedded result JSON IS24 ships in a <script>.

        IS24 nests each listing under the key "resultlist.realEstate" inside the
        searchResponseModel blob. We balance-match every such object directly so
        the parser survives wrapper-key renames, and dedupe by id.
        """
        objs = _extract_json_objects(html, '"resultlist.realEstate"')
        out: list[RawListing] = []
        seen: set[str] = set()
        for ro in objs:
            if not isinstance(ro, dict):
                continue
            ext = str(ro.get("@id") or ro.get("id") or "")
            if not ext or ext in seen:
                continue
            seen.add(ext)
            addr = ro.get("address") or {}
            postal, city = (addr.get("postcode"), addr.get("city"))
            if not postal and isinstance(addr.get("description"), dict):
                postal, city = parse_postal_city(addr["description"].get("text"))
            price = ro.get("price")
            price_val = price.get("value") if isinstance(price, dict) else price
            out.append(
                RawListing(
                    portal=self.portal,
                    external_id=ext,
                    url=f"{BASE}/expose/{ext}",
                    title=ro.get("title", "") or "",
                    price=_num(price_val),
                    living_area_m2=_num(ro.get("livingSpace")),
                    rooms=_num(ro.get("numberOfRooms")),
                    postal_code=postal,
                    city=city or "",
                )
            )
        return out


_GEOAUTOCOMPLETE = f"{BASE}/geoautocomplete/v3/locations.json"


@lru_cache(maxsize=256)
def _resolve_geopath(query: str) -> Optional[str]:
    """Resolve a city/region query to an IS24 geopath (e.g. /de/bayern/muenchen).

    Uses IS24's public geoautocomplete endpoint (not behind DataDome). Returns
    the first entity that carries a geopath; bare postcodes have none, so callers
    should pass the city. Returns None on any failure (network/no match).
    """
    query = (query or "").strip()
    if not query:
        return None
    try:
        resp = httpx.get(
            _GEOAUTOCOMPLETE,
            params={"i": query},
            headers={"User-Agent": random.choice(USER_AGENTS), "Accept": "application/json"},
            timeout=15,
            follow_redirects=True,
        )
        if resp.status_code != 200:
            return None
        for item in resp.json():
            uri = (item.get("entity", {}).get("geopath") or {}).get("uri")
            if uri:
                return uri
    except (httpx.HTTPError, ValueError, KeyError, TypeError):
        return None
    return None


def _num(value) -> float | None:
    """IS24's embedded JSON ships real numbers (or English-decimal strings)."""
    if value is None:
        return None
    if isinstance(value, (int, float)):
        return float(value)
    try:
        return float(str(value).replace(",", "."))
    except ValueError:
        return parse_german_number(str(value))


def _balanced(html: str, start: int, open_ch: str, close_ch: str) -> Optional[str]:
    """Return the balanced open_ch..close_ch span starting at `start`."""
    depth = 0
    in_str = False
    escape = False
    for i in range(start, len(html)):
        ch = html[i]
        if in_str:
            if escape:
                escape = False
            elif ch == "\\":
                escape = True
            elif ch == '"':
                in_str = False
            continue
        if ch == '"':
            in_str = True
        elif ch == open_ch:
            depth += 1
        elif ch == close_ch:
            depth -= 1
            if depth == 0:
                return html[start : i + 1]
    return None


def _extract_json_array(html: str, key: str) -> list:
    """Find `key` and balance-match the JSON array that follows it."""
    ki = html.find(key)
    if ki == -1:
        return []
    start = html.find("[", ki)
    if start == -1:
        return []
    span = _balanced(html, start, "[", "]")
    if not span:
        return []
    try:
        return json.loads(span)
    except json.JSONDecodeError:
        return []


def _extract_json_objects(html: str, key: str) -> list:
    """Find every occurrence of `key:` and balance-match the JSON object after it."""
    out: list = []
    idx = 0
    while True:
        ki = html.find(key, idx)
        if ki == -1:
            break
        start = html.find("{", ki + len(key))
        if start == -1:
            break
        span = _balanced(html, start, "{", "}")
        idx = (start + len(span)) if span else (ki + len(key))
        if not span:
            continue
        try:
            out.append(json.loads(span))
        except json.JSONDecodeError:
            continue
    return out
