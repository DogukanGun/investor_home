import asyncio
from urllib.parse import urlparse
import httpx
from sqlmodel import Session, select
from app.models import Listing

DEAD_PHRASES = {
    "immoscout24.de": ["expose not found", "immobilie nicht mehr verfügbar", "angebot wurde gelöscht"],
    "immowelt.de": ["angebot nicht mehr verfügbar", "diese immobilie ist nicht mehr"],
    "funda.nl": ["helaas, deze woning is niet meer beschikbaar", "object niet gevonden"],
    "idealista.com": ["anuncio no disponible", "this listing is not available"],
    "seloger.com": ["cette annonce n'est plus disponible"],
    "_default": ["listing not found", "page not found", "not available"],
}
HEADERS = {"User-Agent": "Mozilla/5.0 (compatible; InvestorHomeBot/1.0)"}
CONCURRENCY = 10
TIMEOUT = 15.0


async def _is_alive(client: httpx.AsyncClient, listing: Listing) -> bool:
    try:
        r = await client.get(
            listing.url, headers=HEADERS, timeout=TIMEOUT, follow_redirects=True
        )
    except httpx.RequestError:
        return True

    if r.status_code in (404, 410):
        return False

    if str(r.url) != listing.url:
        final_path = urlparse(str(r.url)).path
        if len(final_path) < 10:
            return False

    if r.status_code == 200:
        body = r.text.lower()
        domain = next((k for k in DEAD_PHRASES if k in listing.url), "_default")
        phrases = DEAD_PHRASES[domain] + DEAD_PHRASES["_default"]
        if any(p in body for p in phrases):
            return False

    return True


async def _check_all(listings: list[Listing]) -> list[int]:
    dead_ids: list[int] = []
    sem = asyncio.Semaphore(CONCURRENCY)

    async def bounded(listing):
        async with sem:
            if not await _is_alive(client, listing):
                dead_ids.append(listing.id)

    async with httpx.AsyncClient() as client:
        await asyncio.gather(*[bounded(l) for l in listings])

    return dead_ids


def run_listing_health_check(session: Session) -> dict:
    listings = session.exec(select(Listing)).all()
    if not listings:
        return {"checked": 0, "deleted": 0}

    dead_ids = asyncio.run(_check_all(listings))

    for lid in dead_ids:
        obj = session.get(Listing, lid)
        if obj:
            session.delete(obj)
    session.commit()

    return {"checked": len(listings), "deleted": len(dead_ids)}
