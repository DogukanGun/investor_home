from sqlmodel import Session, SQLModel, create_engine

from app.models import ListingKind, Portal, PropertyType, SavedSearch
from app.scrapers.base import RawListing
from app.services import ingest as ingest_mod
from app.services.analysis import (
    gross_rental_yield,
    latest_area_median,
    refresh_area_stats,
    undervaluation,
)


def _engine():
    eng = create_engine("sqlite://", connect_args={"check_same_thread": False})
    SQLModel.metadata.create_all(eng)
    return eng


def test_full_pipeline(monkeypatch):
    eng = _engine()

    sale_rows = [
        RawListing(Portal.immowelt, "a1", "u/a1", city="Leipzig", postal_code="04109",
                   price=240000, living_area_m2=80),   # 3000 €/m² (cheap)
        RawListing(Portal.immowelt, "a2", "u/a2", city="Leipzig", postal_code="04109",
                   price=360000, living_area_m2=80),   # 4500 €/m²
        RawListing(Portal.sparkasse, "a3", "u/a3", city="Leipzig", postal_code="04109",
                   price=378000, living_area_m2=84),   # 4500 €/m²
    ]
    rent_rows = [
        RawListing(Portal.immowelt, "r1", "u/r1", city="Leipzig", postal_code="04109",
                   price=960, living_area_m2=80),       # 12 €/m²/month
        RawListing(Portal.immowelt, "r2", "u/r2", city="Leipzig", postal_code="04109",
                   price=1000, living_area_m2=80),       # 12.5 €/m²/month
    ]

    class FakeScraper:
        def __init__(self, portal, rows):
            self.portal = portal
            self._rows = rows

        def search(self, search):
            return [r for r in self._rows if r.portal == self.portal]

    def fake_all(rows):
        return [FakeScraper(Portal.immowelt, rows), FakeScraper(Portal.sparkasse, rows)]

    with Session(eng) as session:
        sale_search = SavedSearch(name="buy", city="Leipzig", postal_code="04109",
                                  listing_kind=ListingKind.sale, property_type=PropertyType.apartment)
        rent_search = SavedSearch(name="rent", city="Leipzig", postal_code="04109",
                                  listing_kind=ListingKind.rent, property_type=PropertyType.apartment)
        session.add(sale_search)
        session.add(rent_search)
        session.commit()
        session.refresh(sale_search)
        session.refresh(rent_search)

        monkeypatch.setattr(ingest_mod, "all_scrapers", lambda: fake_all(sale_rows))
        ingest_mod.ingest_search(session, sale_search)
        monkeypatch.setattr(ingest_mod, "all_scrapers", lambda: fake_all(rent_rows))
        ingest_mod.ingest_search(session, rent_search)

        refresh_area_stats(session)

        sale_median = latest_area_median(session, "04109", ListingKind.sale)
        rent_median = latest_area_median(session, "04109", ListingKind.rent)
        assert sale_median == 4500.0  # median of 3000,4500,4500
        assert rent_median in (12.25,)  # median of 12,12.5

        # cheap listing is undervalued vs 4500 median
        under = undervaluation(3000, sale_median)
        assert under > 0.3
        yld = gross_rental_yield(240000, 80, rent_median)
        assert yld == round(80 * rent_median * 12 / 240000, 4)
