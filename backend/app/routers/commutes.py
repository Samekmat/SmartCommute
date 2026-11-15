"""Router handling commute logging and historical statistics aggregation."""

from datetime import UTC, datetime
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from app.database import get_session
from app.models import CommuteLog, Route
from app.schemas import CommuteHistoryResponse, CommuteLogCreate, CommuteLogRead
from app.services.eco_calc import (
    aggregate_commute_metrics,
    calculate_eco_metrics,
)

router = APIRouter(prefix="/api/commutes", tags=["Commutes"])

SessionDep = Annotated[Session, Depends(get_session)]


@router.get("", response_model=CommuteHistoryResponse)
def get_commute_history(session: SessionDep) -> CommuteHistoryResponse:
    """Retrieve full commute log history alongside aggregated ecological impact metrics.

    Parameters
    ----------
    session : Session
        Active database session injected by FastAPI dependency injection.

    Returns
    -------
    CommuteHistoryResponse
        List of recorded commute entries and aggregated totals (CO2, calories, trips).
    """
    logs = session.exec(
        select(CommuteLog).order_by(CommuteLog.logged_at.desc())  # type: ignore[attr-defined]
    ).all()

    summary = aggregate_commute_metrics(logs)

    return CommuteHistoryResponse(
        logs=[CommuteLogRead.model_validate(log) for log in logs],
        total_co2_saved_kg=summary.total_co2_saved_kg,
        total_calories=summary.total_calories,
        trips_count=summary.trips_count,
    )


@router.post("", response_model=CommuteLogRead, status_code=status.HTTP_201_CREATED)
def record_commute_log(payload: CommuteLogCreate, session: SessionDep) -> CommuteLog:
    """Record an actual commute trip, calculating eco metrics automatically.

    Parameters
    ----------
    payload : CommuteLogCreate
        Commute details including route_id, transport_mode, and duration.
    session : Session
        Active database session injected by FastAPI dependency injection.

    Returns
    -------
    CommuteLog
        Newly created and persisted CommuteLog database entity.

    Raises
    ------
    HTTPException
        Status 404 if the specified route_id is not found in the database.
    """
    route = session.get(Route, payload.route_id)
    if route is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Route with ID {payload.route_id} not found",
        )

    eco = calculate_eco_metrics(
        transport_mode=payload.transport_mode, distance_km=route.distance_km
    )
    log_timestamp = payload.logged_at if payload.logged_at else datetime.now(UTC)

    commute_log = CommuteLog(
        route_id=route.id,  # type: ignore[arg-type]
        transport_mode=payload.transport_mode,
        duration_minutes=payload.duration_minutes,
        co2_saved_kg=eco.co2_saved_kg,
        calories_burned=eco.calories_burned,
        logged_at=log_timestamp,
    )

    session.add(commute_log)
    session.commit()
    session.refresh(commute_log)
    return commute_log
