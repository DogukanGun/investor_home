from __future__ import annotations

import hashlib
import logging
import random
import time
from dataclasses import dataclass
from typing import Optional

import httpx

from app.config import CACHE_DIR, settings
from app.models import ListingKind, Portal, PropertyType, SavedSearch

logger = logging.getLogger(__name__)

USER_AGENTS = [
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
]


@dataclass
class RawListing:
    """Portal-agnostic listing produced by every scraper."""

    portal: Portal
    external_id: str
    url: str
    title: str = ""
    listing_kind: ListingKind = ListingKind.sale
    property_type: Optional[PropertyType] = None
    city: str = ""
    postal_code: Optional[str] = None
    address: Optional[str] = None
    price: Optional[float] = None
    living_area_m2: Optional[float] = None
    rooms: Optional[float] = None
    currency: str = "EUR"

    @property
    def price_per_m2(self) -> Optional[float]:
        if self.price and self.living_area_m2 and self.living_area_m2 > 0:
            return round(self.price / self.living_area_m2, 2)
        return None


class BaseScraper:
    portal: Portal
    country: str = "de"

    def __init__(self) -> None:
        self._last_request = 0.0

    # -- politeness ---------------------------------------------------------
    def _throttle(self) -> None:
        delay = random.uniform(settings.request_min_delay_s, settings.request_max_delay_s)
        elapsed = time.monotonic() - self._last_request
        if elapsed < delay:
            time.sleep(delay - elapsed)
        self._last_request = time.monotonic()

    def _headers(self) -> dict[str, str]:
        return {
            "User-Agent": random.choice(USER_AGENTS),
            "Accept-Language": "de-DE,de;q=0.9,en;q=0.8",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        }

    def _cache_path(self, key: str):
        digest = hashlib.sha256(key.encode()).hexdigest()[:24]
        return CACHE_DIR / f"{self.portal.value}_{digest}.html"

    def fetch(self, url: str, params: Optional[dict] = None) -> Optional[str]:
        """HTTP GET with throttling, retry/backoff and on-disk cache."""
        cache_key = url + str(sorted((params or {}).items()))
        cache_file = self._cache_path(cache_key)
        if settings.use_html_cache and cache_file.exists():
            return cache_file.read_text(encoding="utf-8")

        for attempt in range(1, settings.max_retries + 1):
            self._throttle()
            try:
                resp = httpx.get(
                    url,
                    params=params,
                    headers=self._headers(),
                    timeout=settings.request_timeout_s,
                    follow_redirects=True,
                )
                if resp.status_code == 200 and resp.text:
                    if settings.use_html_cache:
                        cache_file.write_text(resp.text, encoding="utf-8")
                    return resp.text
                logger.warning("%s GET %s -> %s (attempt %d)", self.portal, url, resp.status_code, attempt)
            except httpx.HTTPError as exc:
                logger.warning("%s GET %s failed: %s (attempt %d)", self.portal, url, exc, attempt)
            time.sleep(2**attempt)
        return None

    # -- interface ----------------------------------------------------------
    def search(self, search: SavedSearch) -> list[RawListing]:  # pragma: no cover - abstract
        raise NotImplementedError
