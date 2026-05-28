# InvestorHome

A buy-to-let investment tracker for the German market. It scrapes sale and rental
listings from **ImmoScout24**, **Immowelt**, and **Sparkasse Immobilien**, compares each
listing's **price per m²** against the local area median to flag good/bad deals, estimates
**gross rental yield** from scraped rents, and builds a **price-index time series** per area
via scheduled re-scrapes.

## Architecture

```
React/TS dashboard ──HTTP──> FastAPI ──> analysis ──> SQLite/Postgres
                               │                          ▲
                               └─ APScheduler ─> scraper registry ─┘
                                       (immoscout / immowelt / sparkasse)
```

- `backend/app/scrapers/` — one isolated scraper per portal behind a common `BaseScraper`.
  Immowelt & Sparkasse use plain HTTP; ImmoScout24 uses Playwright (headless Chromium).
- `backend/app/services/ingest.py` — runs all portals for a saved search, filters by the
  search conditions, upserts listings, and appends a snapshot per scrape.
- `backend/app/services/analysis.py` — medians, undervaluation %, gross yield, price index.
- `backend/app/scheduler.py` — daily APScheduler job (default 03:00 Europe/Berlin).

## Investment math

- **price_per_m2** = price / living_area_m2
- **Undervaluation %** = (area_median_ppm2 − listing_ppm2) / area_median_ppm2 → positive = cheaper than area = good deal
- **Deal rating** — good ≥ +10%, overpriced ≤ −10%, else fair (configurable in `config.py`)
- **Gross rental yield** = (area_rent_ppm2 × m² × 12) / purchase_price
- **Price index** = area median €/m² over time, rebased to 100 at the first period

## Setup

### Backend
```bash
cd backend
python3 -m venv .venv && . .venv/bin/activate
pip install -r requirements.txt
playwright install chromium      # fallback engine for ImmoScout24
camoufox fetch                   # primary ImmoScout24 engine (downloads patched Firefox)
uvicorn app.main:app --reload    # http://localhost:8000  (docs at /docs)
```

### Frontend
```bash
cd frontend
npm install
npm run dev                       # http://localhost:5173 (proxies /api -> :8000)
```

## Usage

1. Open the dashboard, go to **Searches**, add a saved search (city/postal + filters).
   Create both a **Sale** and a **Rent** search for the same area to get yields.
2. Click **Scrape now** (or wait for the daily job). Listings populate with €/m², a deal
   badge, and gross yield.
3. **Listings** — filter/sort by undervaluation, yield, €/m², or price.
4. **Areas & Index** — per-area medians and the price-index trend (needs ≥2 scrape days).

## Configuration

Environment variables (prefix `INVESTORHOME_`), e.g. `INVESTORHOME_DATABASE_URL`,
`INVESTORHOME_ENABLE_SCHEDULER=false`, `INVESTORHOME_USE_HTML_CACHE=false`,
`INVESTORHOME_GOOD_DEAL_THRESHOLD=0.12`. See `backend/app/config.py`.

ImmoScout24 / DataDome:
- `INVESTORHOME_IS24_ENGINE` — `camoufox` (default), `playwright`, or `off`.
- `INVESTORHOME_IS24_PROXY` — optional residential/mobile proxy, e.g.
  `http://user:pass@host:port`. Leave empty to use your direct connection (free).
- `INVESTORHOME_IS24_HEADLESS` — `true` (default) / `false`.

## Tests
```bash
cd backend && . .venv/bin/activate && pytest
```

## Important notes

- **Scraping is best-effort.** All three portals work today: Immowelt (HTML/JSON-LD),
  Sparkasse (JSON API, supports exact-postal search), and ImmoScout24 (embedded result JSON,
  fetched through **Camoufox** to clear its DataDome bot wall). Selectors/structures change;
  expect to maintain the per-portal parsers in `backend/app/scrapers/`. A failure in one
  portal is logged and skipped — it never breaks the others.
- **ImmoScout24 / DataDome.** Camoufox (a patched real-Firefox build) clears the
  "Ich bin kein Roboter" wall by presenting a legitimate fingerprint, plus light behavioural
  simulation. From a clean residential IP this works with no paid services. If your IP is
  flagged, set `INVESTORHOME_IS24_PROXY` to a residential/mobile proxy. Location is resolved
  via IS24's public geoautocomplete endpoint; exact-postal precision comes from Sparkasse.
- Raw HTML is cached on disk (`backend/data/html_cache/`) so parsers can be re-run without
  re-fetching. Disable with `INVESTORHOME_USE_HTML_CACHE=false`.
- This tool is for **personal/educational use**. Review and respect each portal's Terms of
  Service and `robots.txt` before scraping; throttling is built in but use it responsibly.
