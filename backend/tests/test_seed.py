import pytest
from app.database import init_db
from app.models import CommuteLog, Route
from app.seed import seed_database
from sqlmodel import Session, create_engine, select


@pytest.fixture
def memory_session():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
    )
    init_db(engine)
    with Session(engine) as session:
        yield session


def test_seed_database_populates_routes_and_logs_when_empty(memory_session: Session):
    # Verify initial database is empty
    assert len(memory_session.exec(select(Route)).all()) == 0
    assert len(memory_session.exec(select(CommuteLog)).all()) == 0

    seed_database(memory_session)

    routes = memory_session.exec(select(Route)).all()
    logs = memory_session.exec(select(CommuteLog)).all()

    # Scope requires exactly 3 sample routes and 4 commute logs
    assert len(routes) == 3
    assert len(logs) == 4

    # All logs must link to a valid seeded route
    route_ids = {r.id for r in routes}
    for log in logs:
        assert log.route_id in route_ids
        assert log.duration_minutes > 0
        assert log.transport_mode in ("car", "bike", "public_transit", "walk")


def test_seed_database_is_idempotent(memory_session: Session):
    seed_database(memory_session)
    routes_first = memory_session.exec(select(Route)).all()
    logs_first = memory_session.exec(select(CommuteLog)).all()

    assert len(routes_first) == 3
    assert len(logs_first) == 4

    # Calling seed_database a second time must not duplicate records
    seed_database(memory_session)
    routes_second = memory_session.exec(select(Route)).all()
    logs_second = memory_session.exec(select(CommuteLog)).all()

    assert len(routes_second) == 3
    assert len(logs_second) == 4
