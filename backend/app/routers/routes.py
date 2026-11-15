"""Router handling CRUD operations and AI recommendations for commute routes."""

from collections.abc import Sequence
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from app.database import get_session
from app.models import Route
from app.schemas import (
    AIRecommendationRequest,
    AIRecommendationResponse,
    RouteCreate,
    RouteRead,
    RouteUpdate,
)
from app.seed import seed_database
from app.services.ai_advisor import get_commute_recommendation
from app.services.weather import fetch_weather

router = APIRouter(prefix="/api/routes", tags=["Routes"])

SessionDep = Annotated[Session, Depends(get_session)]


@router.get("", response_model=list[RouteRead])
def list_routes(session: SessionDep) -> Sequence[Route]:
    """Retrieve all predefined commute routes, auto-seeding sample data if empty.

    Parameters
    ----------
    session : Session
        Active database session injected by FastAPI dependency injection.

    Returns
    -------
    Sequence[Route]
        List of all stored commute routes ordered by primary key.
    """
    routes = session.exec(select(Route).order_by(Route.id)).all()
    if not routes:
        seed_database(session)
        routes = session.exec(select(Route).order_by(Route.id)).all()
    return routes


@router.post("", response_model=RouteRead, status_code=status.HTTP_201_CREATED)
def create_route(payload: RouteCreate, session: SessionDep) -> Route:
    """Create a new predefined commute route.

    Parameters
    ----------
    payload : RouteCreate
        Validated route attributes (name, origin, destination, distance, transport).
    session : Session
        Active database session injected by FastAPI dependency injection.

    Returns
    -------
    Route
        Newly created and persisted Route database entity.
    """
    route = Route.model_validate(payload)
    session.add(route)
    session.commit()
    session.refresh(route)
    return route


@router.put("/{route_id}", response_model=RouteRead)
def update_route(route_id: int, payload: RouteUpdate, session: SessionDep) -> Route:
    """Update attributes of an existing commute route.

    Parameters
    ----------
    route_id : int
        Primary key of the route to modify.
    payload : RouteUpdate
        Partial or complete fields to update on the target route.
    session : Session
        Active database session injected by FastAPI dependency injection.

    Returns
    -------
    Route
        Updated and refreshed Route database entity.

    Raises
    ------
    HTTPException
        Status 404 if the route_id does not exist.
    """
    route = session.get(Route, route_id)
    if route is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Route with ID {route_id} not found",
        )

    update_data = payload.model_dump(exclude_unset=True)
    for field_name, value in update_data.items():
        setattr(route, field_name, value)

    session.add(route)
    session.commit()
    session.refresh(route)
    return route


@router.delete("/{route_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_route(route_id: int, session: SessionDep) -> None:
    """Delete a commute route and cascade-remove its associated commute logs.

    Parameters
    ----------
    route_id : int
        Primary key of the route to remove.
    session : Session
        Active database session injected by FastAPI dependency injection.

    Raises
    ------
    HTTPException
        Status 404 if the route_id does not exist.
    """
    route = session.get(Route, route_id)
    if route is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Route with ID {route_id} not found",
        )

    session.delete(route)
    session.commit()


@router.post("/{route_id}/ai-recommend", response_model=AIRecommendationResponse)
async def recommend_commute_mode(
    route_id: int,
    session: SessionDep,
    request: AIRecommendationRequest | None = None,
) -> AIRecommendationResponse:
    """Provide AI Advisor transportation recommendation for a route and weather.

    Parameters
    ----------
    route_id : int
        Primary key of the route to evaluate.
    session : Session
        Active database session injected by FastAPI dependency injection.
    request : AIRecommendationRequest | None
        Optional payload specifying Weather Simulator presets ('rain', 'sunny', etc.).

    Returns
    -------
    AIRecommendationResponse
        Optimal transport recommendation, contextual reasoning, and eco savings.

    Raises
    ------
    HTTPException
        Status 404 if the route_id does not exist.
    """
    route = session.get(Route, route_id)
    if route is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Route with ID {route_id} not found",
        )

    override = request.weather_override if request else None
    weather = await fetch_weather(
        latitude=route.latitude,
        longitude=route.longitude,
        weather_override=override,
    )

    provider = request.provider if request and request.provider else "auto"
    api_key = (
        request.api_key.strip()
        if request and request.api_key and request.api_key.strip()
        else None
    )

    openai_key = api_key if provider == "openai" else None
    gemini_key = api_key if provider == "gemini" else None
    claude_key = api_key if provider == "claude" else None

    # If provider is "auto" and an api_key is supplied, determine by prefix
    if provider == "auto" and api_key:
        if api_key.startswith("AIza"):
            gemini_key = api_key
        elif api_key.startswith("sk-ant"):
            claude_key = api_key
        else:
            openai_key = api_key

    recommendation = await get_commute_recommendation(
        route,
        weather,
        openai_api_key=openai_key,
        gemini_api_key=gemini_key,
        claude_api_key=claude_key,
        preferred_provider=provider,
    )
    return AIRecommendationResponse.model_validate(recommendation)
