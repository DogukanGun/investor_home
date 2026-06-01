from collections.abc import Generator

from sqlalchemy import text
from sqlmodel import Session, SQLModel, create_engine

from app.config import settings

connect_args = {"check_same_thread": False} if settings.database_url.startswith("sqlite") else {}
engine = create_engine(settings.database_url, connect_args=connect_args)


def init_db() -> None:
    from app import models  # noqa: F401

    SQLModel.metadata.create_all(engine)

    # Idempotent column additions — create_all doesn't alter existing tables.
    migrations = [
        ("listing", "latitude", "REAL"),
        ("listing", "longitude", "REAL"),
        ("listing", "currency", "TEXT DEFAULT 'EUR'"),
        ("listing", "country", "TEXT DEFAULT 'de'"),
        ("saved_search", "country", "TEXT DEFAULT 'de'"),
    ]
    with engine.connect() as conn:
        for tbl, col, typ in migrations:
            try:
                conn.execute(text(f"ALTER TABLE {tbl} ADD COLUMN {col} {typ}"))
                conn.commit()
            except Exception:
                pass  # column already exists

    from app.services.geocoder import warm_cache_from_db

    with Session(engine) as session:
        warm_cache_from_db(session)


def get_session() -> Generator[Session, None, None]:
    with Session(engine) as session:
        yield session
