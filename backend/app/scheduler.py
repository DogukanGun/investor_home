from __future__ import annotations

import logging

from datetime import datetime

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger

from app.config import settings
from app.db import engine
from sqlmodel import Session

from app.services.ingest import run_all_active
from app.services.health_check import run_listing_health_check

logger = logging.getLogger(__name__)
_scheduler: BackgroundScheduler | None = None


def _job() -> None:
    logger.info("Scheduled scrape starting")
    with Session(engine) as session:
        result = run_all_active(session)
    logger.info("Scheduled scrape done: %s", result)


def _health_check_job() -> None:
    logger.info("Listing health check starting")
    with Session(engine) as session:
        result = run_listing_health_check(session)
    logger.info("Listing health check done: checked=%d deleted=%d", result["checked"], result["deleted"])


def start_scheduler() -> None:
    global _scheduler
    if not settings.enable_scheduler or _scheduler:
        return
    _scheduler = BackgroundScheduler(timezone="Europe/Berlin")
    _scheduler.add_job(
        _job,
        IntervalTrigger(hours=settings.scrape_interval_hours, start_date=datetime.now()),
        id="daily_scrape",
        replace_existing=True,
    )
    _scheduler.add_job(
        _health_check_job,
        IntervalTrigger(hours=24, start_date=datetime.now()),
        id="listing_health_check",
        replace_existing=True,
    )
    _scheduler.start()
    logger.info("Scheduler started (every %d hours)", settings.scrape_interval_hours)


def shutdown_scheduler() -> None:
    global _scheduler
    if _scheduler:
        _scheduler.shutdown(wait=False)
        _scheduler = None
