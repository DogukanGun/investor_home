from __future__ import annotations

from datetime import date, datetime, timezone
from enum import Enum
from typing import Optional

from sqlmodel import Field, SQLModel, UniqueConstraint


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Portal(str, Enum):
    immoscout = "immoscout"
    immowelt = "immowelt"
    sparkasse = "sparkasse"
    idealista = "idealista"
    idealista_pt = "idealista_pt"
    seloger = "seloger"
    funda = "funda"
    rightmove = "rightmove"


class ListingKind(str, Enum):
    sale = "sale"
    rent = "rent"


class PropertyType(str, Enum):
    apartment = "apartment"
    house = "house"


# ---------------------------------------------------------------------------
# SavedSearch
# ---------------------------------------------------------------------------
class SavedSearchBase(SQLModel):
    name: str
    city: str
    postal_code: Optional[str] = None
    country: str = Field(default="de")
    listing_kind: ListingKind = ListingKind.sale
    property_type: PropertyType = PropertyType.apartment
    price_min: Optional[float] = None
    price_max: Optional[float] = None
    size_min: Optional[float] = None
    size_max: Optional[float] = None
    rooms_min: Optional[float] = None
    rooms_max: Optional[float] = None
    active: bool = True


class SavedSearch(SavedSearchBase, table=True):
    __tablename__ = "saved_search"
    id: Optional[int] = Field(default=None, primary_key=True)
    created_at: datetime = Field(default_factory=utcnow)


class SavedSearchCreate(SavedSearchBase):
    pass


class SavedSearchUpdate(SQLModel):
    name: Optional[str] = None
    city: Optional[str] = None
    postal_code: Optional[str] = None
    country: Optional[str] = None
    listing_kind: Optional[ListingKind] = None
    property_type: Optional[PropertyType] = None
    price_min: Optional[float] = None
    price_max: Optional[float] = None
    size_min: Optional[float] = None
    size_max: Optional[float] = None
    rooms_min: Optional[float] = None
    rooms_max: Optional[float] = None
    active: Optional[bool] = None


# ---------------------------------------------------------------------------
# Listing
# ---------------------------------------------------------------------------
class Listing(SQLModel, table=True):
    __tablename__ = "listing"
    __table_args__ = (UniqueConstraint("portal", "external_id", name="uq_portal_external"),)

    id: Optional[int] = Field(default=None, primary_key=True)
    portal: Portal = Field(index=True)
    external_id: str = Field(index=True)
    url: str
    title: str = ""
    listing_kind: ListingKind = Field(index=True)
    property_type: Optional[PropertyType] = None
    city: str = Field(index=True)
    postal_code: Optional[str] = Field(default=None, index=True)
    address: Optional[str] = None
    price: Optional[float] = None
    living_area_m2: Optional[float] = None
    rooms: Optional[float] = None
    price_per_m2: Optional[float] = Field(default=None, index=True)
    currency: str = Field(default="EUR")
    country: str = Field(default="de")
    latitude: Optional[float] = Field(default=None)
    longitude: Optional[float] = Field(default=None)
    first_seen_at: datetime = Field(default_factory=utcnow)
    last_seen_at: datetime = Field(default_factory=utcnow)
    is_active: bool = Field(default=True, index=True)


# ---------------------------------------------------------------------------
# ListingSnapshot — one row per scrape
# ---------------------------------------------------------------------------
class ListingSnapshot(SQLModel, table=True):
    __tablename__ = "listing_snapshot"
    id: Optional[int] = Field(default=None, primary_key=True)
    listing_id: int = Field(foreign_key="listing.id", index=True)
    scraped_at: datetime = Field(default_factory=utcnow, index=True)
    price: Optional[float] = None
    price_per_m2: Optional[float] = None
    is_active: bool = True


# ---------------------------------------------------------------------------
# AreaStat — materialized aggregates powering price index + undervaluation
# ---------------------------------------------------------------------------
class AreaStat(SQLModel, table=True):
    __tablename__ = "area_stat"
    __table_args__ = (
        UniqueConstraint("area_key", "listing_kind", "period", name="uq_area_period"),
    )
    id: Optional[int] = Field(default=None, primary_key=True)
    area_key: str = Field(index=True)
    listing_kind: ListingKind = Field(index=True)
    period: date = Field(index=True)
    sample_count: int = 0
    median_price_per_m2: Optional[float] = None
    avg_price_per_m2: Optional[float] = None
    p25_price_per_m2: Optional[float] = None
    p75_price_per_m2: Optional[float] = None
