from pathlib import Path

from app.scrapers.immowelt import ImmoweltScraper

FIXTURES = Path(__file__).parent / "fixtures"


def test_parse_jsonld_listings():
    html = (FIXTURES / "immowelt_sample.html").read_text()
    listings = ImmoweltScraper().parse_listings(html)
    assert len(listings) == 2
    first = next(l for l in listings if l.external_id == "1234567")
    assert first.price == 289000
    assert first.living_area_m2 == 85
    assert first.rooms == 3
    assert first.postal_code == "04109"
    assert first.city == "Leipzig"
    assert first.price_per_m2 == round(289000 / 85, 2)


def test_parse_serp_cards():
    html = (FIXTURES / "immowelt_serp.html").read_text()
    listings = ImmoweltScraper().parse_listings(html)
    assert len(listings) == 2
    a = next(l for l in listings if l.external_id == "dc238274-aaaa")
    assert a.price == 189000
    assert a.living_area_m2 == 62
    assert a.rooms == 2
    assert a.postal_code == "04275"
    assert a.city == "Leipzig"
    assert a.price_per_m2 == round(189000 / 62, 2)
    b = next(l for l in listings if l.external_id == "k2fm932")
    assert b.living_area_m2 == 78.5


def test_parse_card_fallback_dedupes():
    html = (FIXTURES / "immowelt_cards.html").read_text()
    listings = ImmoweltScraper().parse_listings(html)
    ids = {l.external_id for l in listings}
    assert ids == {"9990001", "9990002"}
    cheap = next(l for l in listings if l.external_id == "9990001")
    assert cheap.price == 195000
    assert cheap.living_area_m2 == 50


def test_build_url():
    from app.models import ListingKind, PropertyType, SavedSearch

    s = SavedSearch(name="x", city="Leipzig", listing_kind=ListingKind.sale,
                    property_type=PropertyType.apartment)
    assert ImmoweltScraper().build_url(s).endswith("/liste/leipzig/wohnungen/kaufen")
