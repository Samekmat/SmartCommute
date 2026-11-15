"""Automated database seeding with sample routes and historical commute logs."""

from datetime import UTC, datetime, timedelta

from sqlmodel import Session, select

from app.models import CommuteLog, Route


def seed_database(session: Session) -> None:
    """Populate database with sample routes and logs if the route table is empty.

    Ensures zero-config onboarding on first run while maintaining idempotency
    across subsequent application restarts.
    """
    existing_route = session.exec(select(Route)).first()
    if existing_route is not None:
        return

    route_1 = Route(
        name="Dom -> Biuro",
        origin="Krowodrza",
        destination="Zabłocie",
        distance_km=5.5,
        latitude=50.0647,
        longitude=19.9450,
        preferred_transport="bike",
    )
    route_2 = Route(
        name="Mieszkanie -> Rynek",
        origin="Krowodrza Górka",
        destination="Rynek Główny",
        distance_km=3.2,
        latitude=50.0805,
        longitude=19.9320,
        preferred_transport="public_transit",
    )
    route_3 = Route(
        name="Dom -> Park Lotników",
        origin="Czyżyny",
        destination="Park Lotników",
        distance_km=1.8,
        latitude=50.0710,
        longitude=20.0050,
        preferred_transport="walk",
    )

    session.add(route_1)
    session.add(route_2)
    session.add(route_3)
    session.commit()

    session.refresh(route_1)
    session.refresh(route_2)
    session.refresh(route_3)

    now = datetime.now(UTC)

    # Historical commute logs with pre-calculated baseline eco metrics:
    # - bike: 0.17 kg CO2/km saved, 32 kcal/km
    # - public transit: 0.13 kg CO2/km saved, 0 kcal/km
    # - walk: 0.17 kg CO2/km saved, 55 kcal/km
    logs = [
        CommuteLog(
            route_id=route_1.id,  # type: ignore[arg-type]
            transport_mode="bike",
            duration_minutes=20,
            co2_saved_kg=round(0.17 * 5.5, 2),
            calories_burned=round(32 * 5.5),
            logged_at=now - timedelta(days=2, hours=3),
        ),
        CommuteLog(
            route_id=route_1.id,  # type: ignore[arg-type]
            transport_mode="bike",
            duration_minutes=22,
            co2_saved_kg=round(0.17 * 5.5, 2),
            calories_burned=round(32 * 5.5),
            logged_at=now - timedelta(days=1, hours=2),
        ),
        CommuteLog(
            route_id=route_2.id,  # type: ignore[arg-type]
            transport_mode="public_transit",
            duration_minutes=18,
            co2_saved_kg=round(0.13 * 3.2, 2),
            calories_burned=0,
            logged_at=now - timedelta(days=1, hours=5),
        ),
        CommuteLog(
            route_id=route_3.id,  # type: ignore[arg-type]
            transport_mode="walk",
            duration_minutes=24,
            co2_saved_kg=round(0.17 * 1.8, 2),
            calories_burned=round(55 * 1.8),
            logged_at=now - timedelta(hours=4),
        ),
    ]

    for log in logs:
        session.add(log)
    session.commit()
