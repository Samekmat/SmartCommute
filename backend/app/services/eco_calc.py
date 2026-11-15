"""Pure domain calculations for ecological emissions and health metrics."""

from collections.abc import Sequence
from dataclasses import dataclass
from typing import Final

from app.models import CANONICAL_TRANSPORT_MODES, TransportMode

# Emission baseline and transit emission coefficients (kg CO2 / km)
CAR_BASELINE_CO2_PER_KM: Final[float] = 0.17
TRANSIT_CO2_PER_KM: Final[float] = 0.04
TRANSIT_SAVINGS_CO2_PER_KM: Final[float] = 0.13  # 0.17 - 0.04

# Active mobility energy expenditure coefficients (kcal / km)
BIKE_CALORIES_PER_KM: Final[int] = 32
WALK_CALORIES_PER_KM: Final[int] = 55


@dataclass(frozen=True, slots=True)
class EcoMetrics:
    """Calculated environmental and health indicators for a commute."""

    co2_saved_kg: float
    calories_burned: int


@dataclass(frozen=True, slots=True)
class CommuteHistorySummary:
    """Aggregated environmental and health metrics across multiple commutes."""

    total_co2_saved_kg: float
    total_calories: int
    trips_count: int


def aggregate_commute_metrics(
    logs: Sequence[object],
) -> CommuteHistorySummary:
    """Aggregate total CO2 savings, active calories, and trip count from commute logs.

    Parameters
    ----------
    logs : Sequence[object]
        Sequence of commute log records possessing co2_saved_kg and calories_burned attributes.

    Returns
    -------
    CommuteHistorySummary
        Aggregated totals rounded to standard domain precision.
    """
    total_co2 = round(sum(getattr(log, "co2_saved_kg", 0.0) for log in logs), 2)
    total_calories = sum(getattr(log, "calories_burned", 0) for log in logs)
    return CommuteHistorySummary(
        total_co2_saved_kg=total_co2,
        total_calories=total_calories,
        trips_count=len(logs),
    )


def calculate_eco_metrics(
    transport_mode: TransportMode, distance_km: float
) -> EcoMetrics:
    """Calculate saved CO2 (relative to baseline car) and burned active calories.

    Parameters
    ----------
    transport_mode : TransportMode
        One of 'car', 'bike', 'public_transit', or 'walk'.
    distance_km : float
        Commute distance in kilometers, must be strictly positive.

    Returns
    -------
    EcoMetrics
        Dataclass containing rounded saved CO2 (kg) and active calories burned.

    Raises
    ------
    ValueError
        If distance_km <= 0 or transport_mode is unrecognized.
    """
    if distance_km <= 0:
        raise ValueError("distance_km must be greater than 0")

    if transport_mode not in CANONICAL_TRANSPORT_MODES:
        raise ValueError(
            f"Invalid transport mode '{transport_mode}'. Expected one of {CANONICAL_TRANSPORT_MODES}"
        )

    co2_saved: float = 0.0
    calories: int = 0

    match transport_mode:
        case "car":
            co2_saved = 0.0
            calories = 0
        case "public_transit":
            co2_saved = round(TRANSIT_SAVINGS_CO2_PER_KM * distance_km, 2)
            calories = 0
        case "bike":
            co2_saved = round(CAR_BASELINE_CO2_PER_KM * distance_km, 2)
            calories = round(BIKE_CALORIES_PER_KM * distance_km)
        case "walk":
            co2_saved = round(CAR_BASELINE_CO2_PER_KM * distance_km, 2)
            calories = round(WALK_CALORIES_PER_KM * distance_km)
        case _:
            raise ValueError(f"Unhandled transport mode '{transport_mode}'")

    return EcoMetrics(co2_saved_kg=co2_saved, calories_burned=calories)
