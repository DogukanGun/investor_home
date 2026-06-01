from __future__ import annotations

from app.models import Portal
from app.scrapers.base import BaseScraper
from app.scrapers.funda import FundaScraper
from app.scrapers.idealista import IdealistaESScraper, IdealistaPTScraper
from app.scrapers.immoscout import ImmoScoutScraper
from app.scrapers.immowelt import ImmoweltScraper
from app.scrapers.rightmove import RightmoveScraper
from app.scrapers.seloger import SeLogerScraper
from app.scrapers.sparkasse import SparkasseScraper

_SCRAPERS: dict[Portal, type[BaseScraper]] = {
    Portal.immoscout: ImmoScoutScraper,
    Portal.immowelt: ImmoweltScraper,
    Portal.sparkasse: SparkasseScraper,
    Portal.idealista: IdealistaESScraper,
    Portal.idealista_pt: IdealistaPTScraper,
    Portal.seloger: SeLogerScraper,
    Portal.funda: FundaScraper,
    Portal.rightmove: RightmoveScraper,
}


def scrapers_for(country: str) -> list[BaseScraper]:
    """Return all scrapers registered for a given country code."""
    return [cls() for cls in _SCRAPERS.values() if cls.country == country]


def get_scraper(portal: Portal) -> BaseScraper:
    return _SCRAPERS[portal]()
