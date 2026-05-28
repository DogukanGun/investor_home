from __future__ import annotations

import re
from typing import Optional

_NUM_RE = re.compile(r"[-+]?\d[\d.\s]*(?:,\d+)?")


def parse_german_number(text: Optional[str]) -> Optional[float]:
    """Parse German-formatted numbers like '1.234,56 €' or '85 m²' -> float."""
    if not text:
        return None
    match = _NUM_RE.search(text.replace("\xa0", " "))
    if not match:
        return None
    raw = match.group(0).strip().replace(" ", "")
    # German: '.' thousands, ',' decimals
    raw = raw.replace(".", "").replace(",", ".")
    try:
        return float(raw)
    except ValueError:
        return None


def parse_postal_city(text: Optional[str]) -> tuple[Optional[str], Optional[str]]:
    """Extract ('12345', 'Berlin') from an address-ish string."""
    if not text:
        return None, None
    m = re.search(r"\b(\d{5})\b", text)
    postal = m.group(1) if m else None
    city = None
    if m:
        after = text[m.end():].strip(" ,")
        city = after.split(",")[0].strip() or None
    return postal, city
