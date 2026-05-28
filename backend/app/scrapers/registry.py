from __future__ import annotations

from app.models import Portal
from app.scrapers.base import BaseScraper
from app.scrapers.immoscout import ImmoScoutScraper
from app.scrapers.immowelt import ImmoweltScraper
from app.scrapers.sparkasse import SparkasseScraper

_SCRAPERS: dict[Portal, type[BaseScraper]] = {
    Portal.immowelt: ImmoweltScraper,
    Portal.sparkasse: SparkasseScraper,
    Portal.immoscout: ImmoScoutScraper,
}


def all_scrapers() -> list[BaseScraper]:
    return [cls() for cls in _SCRAPERS.values()]


def get_scraper(portal: Portal) -> BaseScraper:
    return _SCRAPERS[portal]()
