"""Database connection, session management, and SQLite engine configuration."""

import os
from collections.abc import Generator
from typing import Any

from sqlalchemy import Engine, event
from sqlmodel import Session, SQLModel, create_engine

DEFAULT_DATABASE_URL = "sqlite:///smart_commute.db"
DATABASE_URL = os.getenv("DATABASE_URL", DEFAULT_DATABASE_URL)


@event.listens_for(Engine, "connect")
def set_sqlite_pragma(dbapi_connection: Any, connection_record: Any) -> None:
    """Enforce SQLite foreign key constraints and cascade deletion on connect."""
    if type(dbapi_connection).__module__.startswith("sqlite3"):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()


connect_args = {"check_same_thread": False} if "sqlite" in DATABASE_URL else {}
engine = create_engine(DATABASE_URL, echo=False, connect_args=connect_args)


def init_db(target_engine: Engine | None = None) -> None:
    """Create all SQLModel database tables for the active engine."""
    active_engine = target_engine or engine
    SQLModel.metadata.create_all(active_engine)


def get_session() -> Generator[Session, None, None]:
    """Yield a transactional database session for request lifecycle."""
    with Session(engine) as session:
        yield session
