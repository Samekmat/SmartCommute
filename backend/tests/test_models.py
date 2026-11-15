from datetime import UTC, datetime

import pytest
from app.models import CommuteLog, Route


def test_create_valid_route_with_defaults():
    route = Route(
        name="Home to Office",
        origin="Krowodrza",
        destination="Zabłocie",
        distance_km=5.4,
        preferred_transport="bike",
    )

    assert route.id is None
    assert route.name == "Home to Office"
    assert route.origin == "Krowodrza"
    assert route.destination == "Zabłocie"
    assert route.distance_km == 5.4
    assert route.latitude == 50.0647
    assert route.longitude == 19.9450
    assert route.preferred_transport == "bike"
    assert isinstance(route.created_at, datetime)


def test_route_distance_km_must_be_greater_than_zero():
    with pytest.raises(ValueError):
        Route(
            name="Invalid Distance Route",
            origin="Point A",
            destination="Point B",
            distance_km=0.0,
            preferred_transport="car",
        )

    with pytest.raises(ValueError):
        Route(
            name="Negative Distance Route",
            origin="Point A",
            destination="Point B",
            distance_km=-2.5,
            preferred_transport="car",
        )


def test_route_preferred_transport_must_be_canonical_mode():
    with pytest.raises(ValueError):
        Route(
            name="Invalid Transport Mode",
            origin="Point A",
            destination="Point B",
            distance_km=3.0,
            preferred_transport="rocket",  # type: ignore[arg-type]
        )


def test_create_valid_commute_log():
    now = datetime.now(UTC)
    log = CommuteLog(
        route_id=1,
        transport_mode="bike",
        duration_minutes=20,
        co2_saved_kg=0.92,
        calories_burned=173,
        logged_at=now,
    )

    assert log.id is None
    assert log.route_id == 1
    assert log.transport_mode == "bike"
    assert log.duration_minutes == 20
    assert log.co2_saved_kg == 0.92
    assert log.calories_burned == 173
    assert log.logged_at == now


def test_commute_log_duration_minutes_must_be_greater_than_zero():
    with pytest.raises(ValueError):
        CommuteLog(
            route_id=1,
            transport_mode="walk",
            duration_minutes=0,
            co2_saved_kg=0.5,
            calories_burned=50,
        )


def test_commute_log_transport_mode_must_be_canonical_mode():
    with pytest.raises(ValueError):
        CommuteLog(
            route_id=1,
            transport_mode="plane",  # type: ignore[arg-type]
            duration_minutes=30,
            co2_saved_kg=0.0,
            calories_burned=0,
        )
