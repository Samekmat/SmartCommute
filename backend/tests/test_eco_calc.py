"""Tests for eco and health calculations (CO2 savings and calorie burn)."""

import pytest
from app.models import CANONICAL_TRANSPORT_MODES, TransportMode
from app.services.eco_calc import (
    EcoMetrics,
    aggregate_commute_metrics,
    calculate_eco_metrics,
)


def test_calculate_eco_metrics_car():
    """Car commute provides zero CO2 savings and zero active calories."""
    metrics = calculate_eco_metrics(transport_mode="car", distance_km=10.0)
    assert metrics == EcoMetrics(co2_saved_kg=0.0, calories_burned=0)


def test_calculate_eco_metrics_public_transit():
    """Public transit saves 0.13 kg CO2/km compared to baseline car."""
    metrics = calculate_eco_metrics(transport_mode="public_transit", distance_km=10.0)
    # (0.17 - 0.04) * 10 = 1.30 kg CO2
    assert metrics == EcoMetrics(co2_saved_kg=1.3, calories_burned=0)


def test_calculate_eco_metrics_bike():
    """Bike saves 0.17 kg CO2/km and burns 32 kcal/km."""
    metrics = calculate_eco_metrics(transport_mode="bike", distance_km=5.0)
    # 0.17 * 5.0 = 0.85 kg CO2, 32 * 5.0 = 160 kcal
    assert metrics == EcoMetrics(co2_saved_kg=0.85, calories_burned=160)


def test_calculate_eco_metrics_walk():
    """Walk saves 0.17 kg CO2/km and burns 55 kcal/km."""
    metrics = calculate_eco_metrics(transport_mode="walk", distance_km=2.0)
    # 0.17 * 2.0 = 0.34 kg CO2, 55 * 2.0 = 110 kcal
    assert metrics == EcoMetrics(co2_saved_kg=0.34, calories_burned=110)


def test_calculate_eco_metrics_rejects_non_positive_distance():
    """Distance must be strictly positive."""
    with pytest.raises(ValueError, match="distance_km must be greater than 0"):
        calculate_eco_metrics(transport_mode="bike", distance_km=0.0)

    with pytest.raises(ValueError, match="distance_km must be greater than 0"):
        calculate_eco_metrics(transport_mode="bike", distance_km=-5.0)


def test_calculate_eco_metrics_fractional_distance():
    """Fractional distances are correctly computed and rounded to domain specifications."""
    # Car 3.5 km: baseline zero savings and zero calories
    car_metrics = calculate_eco_metrics(transport_mode="car", distance_km=3.5)
    assert car_metrics == EcoMetrics(co2_saved_kg=0.0, calories_burned=0)

    # Bike 0.5 km: 0.17 * 0.5 = 0.085 -> rounded to 0.09 kg CO2, 32 * 0.5 = 16 kcal
    bike_metrics = calculate_eco_metrics(transport_mode="bike", distance_km=0.5)
    assert bike_metrics == EcoMetrics(co2_saved_kg=0.09, calories_burned=16)

    # Walk 1.75 km: 0.17 * 1.75 = 0.2975 -> 0.3 kg CO2, 55 * 1.75 = 96.25 -> 96 kcal
    walk_metrics = calculate_eco_metrics(transport_mode="walk", distance_km=1.75)
    assert walk_metrics == EcoMetrics(co2_saved_kg=0.3, calories_burned=96)

    # Public transit 2.5 km: 0.13 * 2.5 = 0.325 -> 0.33 kg CO2, 0 kcal
    transit_metrics = calculate_eco_metrics(
        transport_mode="public_transit", distance_km=2.5
    )
    assert transit_metrics == EcoMetrics(co2_saved_kg=0.33, calories_burned=0)


@pytest.mark.parametrize("mode", CANONICAL_TRANSPORT_MODES)
@pytest.mark.parametrize("invalid_distance", [0.0, -0.01, -10.5])
def test_calculate_eco_metrics_rejects_non_positive_distance_for_all_modes(
    mode: TransportMode, invalid_distance: float
):
    """Distance must be strictly positive (> 0) across all supported modes."""
    with pytest.raises(ValueError, match="distance_km must be greater than 0"):
        calculate_eco_metrics(transport_mode=mode, distance_km=invalid_distance)


def test_calculate_eco_metrics_rejects_invalid_transport_mode():
    """Unknown transport mode raises ValueError."""
    with pytest.raises(ValueError, match="Invalid transport mode"):
        calculate_eco_metrics(transport_mode="helicopter", distance_km=10.0)  # type: ignore[arg-type]


def test_aggregate_commute_metrics():
    """aggregate_commute_metrics computes sum of CO2 savings, calories, and count."""

    class MockLog:
        def __init__(self, co2: float, cal: int):
            self.co2_saved_kg = co2
            self.calories_burned = cal

    logs = [MockLog(1.25, 150), MockLog(0.75, 80)]
    summary = aggregate_commute_metrics(logs)
    assert summary.total_co2_saved_kg == 2.0
    assert summary.total_calories == 230
    assert summary.trips_count == 2


def test_aggregate_commute_metrics_empty_logs():
    """Aggregating an empty sequence of logs yields zero totals and zero count."""
    summary = aggregate_commute_metrics([])
    assert summary.total_co2_saved_kg == 0.0
    assert summary.total_calories == 0
    assert summary.trips_count == 0
