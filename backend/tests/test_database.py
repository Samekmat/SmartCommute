import pytest
from app.database import init_db
from app.models import CommuteLog, Route
from sqlalchemy.exc import IntegrityError
from sqlmodel import Session, create_engine, select


@pytest.fixture
def memory_session():
    # Use in-memory SQLite database for test isolation
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
    )
    init_db(engine)
    with Session(engine) as session:
        yield session


def test_cascade_delete_route_removes_associated_commute_logs(memory_session: Session):
    route = Route(
        name="Krowodrza to Zabłocie",
        origin="Krowodrza",
        destination="Zabłocie",
        distance_km=6.2,
        preferred_transport="bike",
    )
    memory_session.add(route)
    memory_session.commit()
    memory_session.refresh(route)

    log1 = CommuteLog(
        route_id=route.id,  # type: ignore[arg-type]
        transport_mode="bike",
        duration_minutes=25,
        co2_saved_kg=1.05,
        calories_burned=198,
    )
    log2 = CommuteLog(
        route_id=route.id,  # type: ignore[arg-type]
        transport_mode="walk",
        duration_minutes=60,
        co2_saved_kg=1.05,
        calories_burned=341,
    )
    memory_session.add(log1)
    memory_session.add(log2)
    memory_session.commit()

    logs = memory_session.exec(
        select(CommuteLog).where(CommuteLog.route_id == route.id)
    ).all()
    assert len(logs) == 2

    # Delete the parent route
    memory_session.delete(route)
    memory_session.commit()

    # Verify CASCADE: child logs must be removed
    remaining_logs = memory_session.exec(
        select(CommuteLog).where(CommuteLog.route_id == route.id)
    ).all()
    assert len(remaining_logs) == 0


def test_foreign_key_violation_raises_integrity_error(memory_session: Session):
    orphan_log = CommuteLog(
        route_id=999999,  # Non-existent route
        transport_mode="car",
        duration_minutes=15,
        co2_saved_kg=0.0,
        calories_burned=0,
    )
    memory_session.add(orphan_log)
    with pytest.raises(IntegrityError):
        memory_session.commit()
