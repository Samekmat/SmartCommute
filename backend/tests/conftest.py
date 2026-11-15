"""Test fixtures and shared in-memory database configurations."""

from collections.abc import Generator

import pytest
from app.database import init_db
from sqlmodel import Session, create_engine


@pytest.fixture
def memory_session() -> Generator[Session, None, None]:
    """Provide an isolated in-memory SQLite session with foreign keys enabled."""
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
    )
    init_db(engine)
    with Session(engine) as session:
        yield session
