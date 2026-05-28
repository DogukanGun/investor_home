from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
CACHE_DIR = DATA_DIR / "html_cache"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="INVESTORHOME_", env_file=".env")

    database_url: str = f"sqlite:///{DATA_DIR / 'investorhome.db'}"

    # Scraping politeness
    request_min_delay_s: float = 1.5
    request_max_delay_s: float = 4.0
    request_timeout_s: float = 30.0
    max_retries: int = 3
    max_pages_per_search: int = 3
    use_html_cache: bool = True

    # ImmoScout24 (DataDome bypass)
    is24_engine: str = "camoufox"  # camoufox | playwright | off
    is24_proxy: str | None = None  # e.g. http://user:pass@host:port; empty = direct/free
    is24_headless: bool = True

    # Scheduler
    enable_scheduler: bool = True
    scrape_cron_hour: int = 3  # daily at 03:00 local

    # Investment thresholds (undervaluation %)
    good_deal_threshold: float = 0.10  # >=10% cheaper than area median
    overpriced_threshold: float = -0.10  # >=10% more expensive

    cors_origins: list[str] = ["http://localhost:5173", "http://127.0.0.1:5173"]


settings = Settings()

DATA_DIR.mkdir(parents=True, exist_ok=True)
CACHE_DIR.mkdir(parents=True, exist_ok=True)
