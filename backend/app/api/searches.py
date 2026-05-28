from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from app.db import get_session
from app.models import SavedSearch, SavedSearchCreate, SavedSearchUpdate

router = APIRouter(prefix="/api/searches", tags=["searches"])


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
