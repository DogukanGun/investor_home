from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlmodel import Session, select

from app.db import get_session
from app.models import ListingKind, PropertyType, SavedSearch, SavedSearchCreate, SavedSearchUpdate

router = APIRouter(prefix="/api/searches", tags=["searches"])

GERMANY_TOP_50 = [
    "Berlin", "Hamburg", "München", "Köln", "Frankfurt am Main",
    "Stuttgart", "Düsseldorf", "Leipzig", "Dortmund", "Essen",
    "Bremen", "Dresden", "Hannover", "Nürnberg", "Duisburg",
    "Bochum", "Wuppertal", "Bielefeld", "Bonn", "Münster",
    "Karlsruhe", "Mannheim", "Augsburg", "Wiesbaden", "Gelsenkirchen",
    "Mönchengladbach", "Braunschweig", "Chemnitz", "Kiel", "Aachen",
    "Halle (Saale)", "Magdeburg", "Freiburg im Breisgau", "Krefeld", "Lübeck",
    "Oberhausen", "Erfurt", "Mainz", "Rostock", "Kassel",
    "Hagen", "Hamm", "Saarbrücken", "Mülheim an der Ruhr", "Potsdam",
    "Ludwigshafen am Rhein", "Oldenburg", "Leverkusen", "Osnabrück", "Solingen",
]


class BulkGermanyIn(BaseModel):
    listing_kind: ListingKind = ListingKind.sale
    property_type: PropertyType = PropertyType.apartment
    price_max: float | None = None


@router.get("", response_model=list[SavedSearch])
def list_searches(session: Session = Depends(get_session)):
    return session.exec(select(SavedSearch).order_by(SavedSearch.created_at.desc())).all()


@router.post("", response_model=SavedSearch, status_code=201)
def create_search(payload: SavedSearchCreate, session: Session = Depends(get_session)):
    search = SavedSearch.model_validate(payload)
    session.add(search)
    session.commit()
    session.refresh(search)
    return search


@router.get("/{search_id}", response_model=SavedSearch)
def get_search(search_id: int, session: Session = Depends(get_session)):
    search = session.get(SavedSearch, search_id)
    if not search:
        raise HTTPException(404, "Search not found")
    return search


@router.patch("/{search_id}", response_model=SavedSearch)
def update_search(search_id: int, payload: SavedSearchUpdate, session: Session = Depends(get_session)):
    search = session.get(SavedSearch, search_id)
    if not search:
        raise HTTPException(404, "Search not found")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(search, k, v)
    session.add(search)
    session.commit()
    session.refresh(search)
    return search


@router.delete("/{search_id}", status_code=204)
def delete_search(search_id: int, session: Session = Depends(get_session)):
    search = session.get(SavedSearch, search_id)
    if not search:
        raise HTTPException(404, "Search not found")
    session.delete(search)
    session.commit()


@router.post("/bulk-germany", status_code=201)
def bulk_germany(payload: BulkGermanyIn, session: Session = Depends(get_session)):
    """Create saved searches for Germany's top 50 cities (skips existing ones)."""
    existing_names = {
        s.name for s in session.exec(select(SavedSearch).where(SavedSearch.country == "de")).all()
    }
    created, skipped = 0, 0
    for city in GERMANY_TOP_50:
        name = f"DE – {city}"
        if name in existing_names:
            skipped += 1
            continue
        search = SavedSearch(
            name=name,
            city=city,
            country="de",
            listing_kind=payload.listing_kind,
            property_type=payload.property_type,
            price_max=payload.price_max,
            active=True,
        )
        session.add(search)
        created += 1
    session.commit()
    return {"created": created, "skipped": skipped}
