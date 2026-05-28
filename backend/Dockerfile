# Backend image: FastAPI + scrapers (Playwright Chromium + Camoufox/Firefox).
# Built on the Playwright base image which ships all browser system libraries.
FROM mcr.microsoft.com/playwright/python:v1.60.0-jammy

WORKDIR /app
ENV PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Download browser engines used by the ImmoScout24 scraper.
# Camoufox (patched Firefox) is primary; Chromium is the fallback engine.
RUN python -m camoufox fetch && playwright install chromium

COPY app ./app

# SQLite DB + HTML cache live here; mounted as a named volume in compose.
RUN mkdir -p data
VOLUME ["/app/data"]

EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
