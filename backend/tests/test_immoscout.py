from pathlib import Path

from app.scrapers.immoscout import ImmoScoutScraper

FIXTURES = Path(__file__).parent / "fixtures"


def test_parse_search_response_model():
    html = (FIXTURES / "immoscout_searchmodel.html").read_text()
    listings = ImmoScoutScraper().parse_listings(html)
    assert len(listings) == 2
    a = next(l for l in listings if l.external_id == "159111222")
    assert a.price == 890000
    assert a.living_area_m2 == 86.5
    assert a.rooms == 3
    assert a.postal_code == "80333"
    assert a.city == "München"
    assert a.price_per_m2 == round(890000 / 86.5, 2)
    assert a.url.endswith("/expose/159111222")


def test_build_url_uses_resolved_geopath(monkeypatch):
    from app.models import ListingKind, PropertyType, SavedSearch
    from app.scrapers import immoscout as mod

    monkeypatch.setattr(mod, "_resolve_geopath", lambda q: "/de/bayern/muenchen")
    s = SavedSearch(name="x", city="München", postal_code="80333",
                    listing_kind=ListingKind.sale, property_type=PropertyType.apartment)
    url = ImmoScoutScraper().build_url(s)
    assert url == "https://www.immobilienscout24.de/Suche/de/bayern/muenchen/wohnung-kaufen"


def test_build_url_falls_back_to_slug(monkeypatch):
    from app.models import ListingKind, PropertyType, SavedSearch
    from app.scrapers import immoscout as mod

    monkeypatch.setattr(mod, "_resolve_geopath", lambda q: None)
    s = SavedSearch(name="x", city="München", listing_kind=ListingKind.sale,
                    property_type=PropertyType.apartment)
    url = ImmoScoutScraper().build_url(s)
    assert url.endswith("/Suche/de/münchen/wohnung-kaufen")


def test_house_kind_in_url(monkeypatch):
    from app.models import ListingKind, PropertyType, SavedSearch
    from app.scrapers import immoscout as mod

    monkeypatch.setattr(mod, "_resolve_geopath", lambda q: "/de/bayern/muenchen")
    s = SavedSearch(name="x", city="München", listing_kind=ListingKind.sale,
                    property_type=PropertyType.house)
    assert ImmoScoutScraper().build_url(s).endswith("/haus-kaufen")
