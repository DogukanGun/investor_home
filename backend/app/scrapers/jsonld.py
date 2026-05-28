from __future__ import annotations

import json
import re

from selectolax.parser import HTMLParser

from app.models import Portal
from app.scrapers.base import RawListing
from app.scrapers.parse import parse_german_number, parse_postal_city

_OFFER_TYPES = {"Offer", "RealEstateListing", "Residence", "Apartment", "House", "SingleFamilyResidence"}


def extract_jsonld_listings(html: str, portal: Portal, base_url: str) -> list[RawListing]:
    tree = HTMLParser(html)
    out: list[RawListing] = []
    for node in tree.css('script[type="application/ld+json"]'):
        try:
            data = json.loads(node.text())
        except (json.JSONDecodeError, TypeError):
            continue
        for obj in _iter_offers(data):
            rl = _offer_to_raw(obj, portal, base_url)
            if rl:
                out.append(rl)
    return _dedupe(out)


def _iter_offers(data):
    if isinstance(data, list):
        for d in data:
            yield from _iter_offers(d)
    elif isinstance(data, dict):
        t = data.get("@type", "")
        types = t if isinstance(t, list) else [t]
        if any(x in _OFFER_TYPES for x in types):
            yield data
        for v in data.values():
            if isinstance(v, (dict, list)):
                yield from _iter_offers(v)


def _offer_to_raw(obj: dict, portal: Portal, base_url: str) -> RawListing | None:
    url = obj.get("url") or obj.get("@id")
    if not url:
        return None
    ext = re.sub(r"\D", "", url.rstrip("/").split("/")[-1]) or url
    price = obj.get("price")
    if isinstance(price, dict):
        price = price.get("price") or price.get("value")
    offers = obj.get("offers")
    if price is None and isinstance(offers, dict):
        price = offers.get("price")
    area = None
    fs = obj.get("floorSize")
    if isinstance(fs, dict):
        area = parse_german_number(str(fs.get("value")))
    addr = obj.get("address")
    postal = city = None
    if isinstance(addr, dict):
        postal = addr.get("postalCode")
        city = addr.get("addressLocality")
    elif isinstance(addr, str):
        postal, city = parse_postal_city(addr)
    return RawListing(
        portal=portal,
        external_id=str(ext),
        url=url if str(url).startswith("http") else f"{base_url}{url}",
        title=obj.get("name", "") or "",
        price=parse_german_number(str(price)) if price is not None else None,
        living_area_m2=area,
        rooms=parse_german_number(str(obj.get("numberOfRooms"))),
        postal_code=postal,
        city=city or "",
    )


def _dedupe(items: list[RawListing]) -> list[RawListing]:
    seen, uniq = set(), []
    for r in items:
        if r.external_id not in seen:
            seen.add(r.external_id)
            uniq.append(r)
    return uniq
