"""Haversine great-circle distance utility for radius-based filtering."""
from __future__ import annotations

import math
from typing import Optional

_EARTH_RADIUS_KM = 6371.0


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Return great-circle distance in km between two (lat, lon) points."""
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    d_phi = math.radians(lat2 - lat1)
    d_lam = math.radians(lon2 - lon1)
    a = (
        math.sin(d_phi / 2) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(d_lam / 2) ** 2
    )
    return _EARTH_RADIUS_KM * 2 * math.asin(math.sqrt(a))


def within_radius(
    center_lat: float,
    center_lon: float,
    listing_lat: Optional[float],
    listing_lon: Optional[float],
    radius_km: float,
) -> bool:
    """Return True if listing coords fall within radius_km of center, False if no coords."""
    if listing_lat is None or listing_lon is None:
        return False
    return haversine_km(center_lat, center_lon, listing_lat, listing_lon) <= radius_km
