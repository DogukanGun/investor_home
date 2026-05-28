from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session

from app.db import get_session
from app.models import SavedSearch
from app.services.analysis import refresh_area_stats
from app.services.ingest import ingest_search, run_all_active

router = APIRouter(prefix="/api/scrape", tags=["scrape"])


@router.post("/search/{search_id}")
def scrape_search(search_id: int, session: Session = Depends(get_session)):
    search = session.get(SavedSearch, search_id)
    if not search:
        raise HTTPException(404, "Search not found")
    result = ingest_search(session, search)
    refresh_area_stats(session)
    return result


@router.post("/all")
def scrape_all(session: Session = Depends(get_session)):
    return run_all_active(session)
