from __future__ import annotations

import logging

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger

from app.config import settings
from app.db import engine
from sqlmodel import Session

from app.services.ingest import run_all_active

logger = logging.getLogger(__name__)
_scheduler: BackgroundScheduler | None = None


def _job() -> None:
    logger.info("Scheduled scrape starting")
    with Session(engine) as session:
        result = run_all_active(session)
    logger.info("Scheduled scrape done: %s", result)


def start_scheduler() -> None:
    global _scheduler
    if not settings.enable_scheduler or _scheduler:
        return
    _scheduler = BackgroundScheduler(timezone="Europe/Berlin")
    _scheduler.add_job(
        _job,
        CronTrigger(hour=settings.scrape_cron_hour, minute=0),
        id="daily_scrape",
        replace_existing=True,
    )
    _scheduler.start()
    logger.info("Scheduler started (daily at %02d:00 Europe/Berlin)", settings.scrape_cron_hour)


def shutdown_scheduler() -> None:
    global _scheduler
    if _scheduler:
        _scheduler.shutdown(wait=False)
        _scheduler = None
