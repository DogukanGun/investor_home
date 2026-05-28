from app.models import ListingKind, Portal, PropertyType
from app.scrapers.sparkasse import SparkasseScraper

API_RESPONSE = {
    "page": 1,
    "pageCount": 1,
    "totalItems": 2,
    "estates": [
        {
            "id": "FID-F13-099-459",
            "objectType": "flat",
            "marketingType": "buy",
            "title": "Zeitnah bezugsfreie Wohnung",
            "subtitle": "München",
            "priceData": {"name": "purchasePrice", "numeric": 850000, "value": "850.000 €"},
            "price": "850.000 €",
            "mainFacts": [
                {"name": "livingSpace", "numeric": 74, "value": "74 m²"},
                {"name": "roomNumber", "numeric": 25, "value": "2.5"},
            ],
        },
        {
            "id": "FID-H01-000-001",
            "objectType": "house",
            "marketingType": "buy",
            "title": "Einfamilienhaus",
            "subtitle": "München",
            "priceData": {"numeric": 1200000, "value": "1.200.000 €"},
            "mainFacts": [{"name": "livingSpace", "numeric": 140, "value": "140 m²"}],
        },
    ],
}


def test_sparkasse_parses_api_and_filters_object_type(monkeypatch):
    scraper = SparkasseScraper()
    monkeypatch.setattr(scraper, "fetch_json", lambda params: API_RESPONSE)

    from app.models import SavedSearch

    search = SavedSearch(
        name="m", city="München", postal_code="80333",
        listing_kind=ListingKind.sale, property_type=PropertyType.apartment,
    )
    results = scraper.search(search)

    # only the flat is kept (apartment search filters out the house)
    assert len(results) == 1
    r = results[0]
    assert r.portal == Portal.sparkasse
    assert r.external_id == "FID-F13-099-459"
    assert r.price == 850000
    assert r.living_area_m2 == 74
    assert r.rooms == 2.5  # parsed from value, not the broken numeric (25)
    assert r.postal_code == "80333"  # taken from the searched PLZ
    assert r.price_per_m2 == round(850000 / 74, 2)
    assert r.url == "https://immobilien.sparkasse.de/expose/FID-F13-099-459.html"
