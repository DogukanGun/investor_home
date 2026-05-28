from app.scrapers.parse import parse_german_number, parse_postal_city
from app.services.analysis import (
    deal_rating,
    gross_rental_yield,
    percentile,
    undervaluation,
)


def test_parse_german_number():
    assert parse_german_number("289.000 €") == 289000.0
    assert parse_german_number("1.234,56 €") == 1234.56
    assert parse_german_number("85 m²") == 85.0
    assert parse_german_number(None) is None
    assert parse_german_number("k.A.") is None


def test_parse_postal_city():
    assert parse_postal_city("Musterstraße 1, 04109 Leipzig") == ("04109", "Leipzig")
    assert parse_postal_city("no postal here") == (None, None)


def test_undervaluation_and_rating():
    # listing cheaper than area median => positive => good
    under = undervaluation(3000, 3600)
    assert round(under, 4) == round((3600 - 3000) / 3600, 4)
    assert deal_rating(under) == "good"
    assert deal_rating(undervaluation(3600, 3600)) == "fair"
    assert deal_rating(undervaluation(4200, 3600)) == "overpriced"
    assert deal_rating(None) == "unknown"


def test_gross_rental_yield():
    # 80 m² @ 12 €/m²/month rent, 320k purchase => 11520/320000
    y = gross_rental_yield(320000, 80, 12)
    assert y == round(80 * 12 * 12 / 320000, 4)
    assert gross_rental_yield(None, 80, 12) is None


def test_percentile():
    assert percentile([], 0.5) is None
    assert percentile([10], 0.5) == 10
    assert percentile([1, 2, 3, 4], 0.25) == 1.75
