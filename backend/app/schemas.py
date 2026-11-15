"""Pydantic v2 data transfer schemas for SmartCommute REST API contracts."""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

from app.models import TransportMode
from app.services.ai_advisor import AISource
from app.services.weather import WeatherOverride


class RouteBase(BaseModel):
    """Base schema attributes for a predefined commute route."""

    name: str = Field(min_length=1, description="Human-readable route name")
    origin: str = Field(min_length=1, description="Origin point or address")
    destination: str = Field(min_length=1, description="Destination point or address")
    distance_km: float = Field(gt=0, description="Route distance in kilometers")
    latitude: float = Field(
        default=50.0647, description="Latitude for weather lookup (default: Kraków)"
    )
    longitude: float = Field(
        default=19.9450, description="Longitude for weather lookup (default: Kraków)"
    )
    preferred_transport: TransportMode = Field(
        description="Canonical preferred mode: 'car', 'bike', 'public_transit', or 'walk'"
    )


class RouteCreate(RouteBase):
    """Payload for creating a new Route."""


class RouteUpdate(BaseModel):
    """Payload for updating an existing Route (all fields optional)."""

    name: str | None = Field(default=None, min_length=1)
    origin: str | None = Field(default=None, min_length=1)
    destination: str | None = Field(default=None, min_length=1)
    distance_km: float | None = Field(default=None, gt=0)
    latitude: float | None = None
    longitude: float | None = None
    preferred_transport: TransportMode | None = None


class RouteRead(RouteBase):
    """Complete representation of a Route returned from the API."""

    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CommuteLogBase(BaseModel):
    """Base schema attributes for a commute log entry."""

    route_id: int = Field(description="Foreign key of the associated Route")
    transport_mode: TransportMode = Field(
        description="Transport mode chosen for the commute"
    )
    duration_minutes: int = Field(
        gt=0, description="Commute duration in minutes (strictly positive)"
    )


class CommuteLogCreate(CommuteLogBase):
    """Payload for recording a completed commute trip.

    Eco metrics (CO2 savings and burned active calories) are recalculated
    server-side to guarantee strict domain accounting integrity.
    """

    logged_at: datetime | None = Field(
        default=None, description="Optional custom timestamp"
    )


class CommuteLogRead(CommuteLogBase):
    """Complete representation of a recorded commute log."""

    id: int
    co2_saved_kg: float
    calories_burned: int
    logged_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CommuteHistoryResponse(BaseModel):
    """Aggregated commute history and total eco metrics."""

    logs: list[CommuteLogRead]
    total_co2_saved_kg: float
    total_calories: int
    trips_count: int


class AIRecommendationRequest(BaseModel):
    """Optional payload specifying Weather Simulator overrides and AI provider preference."""

    weather_override: WeatherOverride | None = Field(
        default=None,
        description="Simulator override preset: 'rain', 'sunny', 'windy', or 'cold'",
    )
    provider: Literal["auto", "gemini", "openai", "claude"] | None = Field(
        default="auto",
        description="Target AI provider ('auto', 'gemini', 'openai', 'claude')",
    )
    api_key: str | None = Field(
        default=None,
        description="Optional transient API key passed for current session",
    )


class AIRecommendationResponse(BaseModel):
    """Structured AI Advisor transportation recommendation with contextual reasoning."""

    recommended_mode: TransportMode = Field(
        description="Optimal transport mode recommended"
    )
    weather_summary: str = Field(description="Summary of prevailing weather conditions")
    reasoning: str = Field(description="Contextual explanation for the recommendation")
    estimated_duration_min: int = Field(
        gt=0, description="Estimated trip duration in minutes"
    )
    potential_co2_saved_kg: float = Field(
        ge=0.0, description="Estimated kg of CO2 saved vs baseline car"
    )
    calories_estimate: int = Field(ge=0, description="Estimated active calories burned")
    ai_source: AISource = Field(
        description="Source of recommendation: 'llm', 'gemini', 'openai', 'claude', or 'heuristic_fallback'"
    )
    provider: str | None = Field(
        default=None,
        description="Identifier of AI model/provider that generated recommendation",
    )

    model_config = ConfigDict(from_attributes=True)


class AIStatusResponse(BaseModel):
    """Configuration status of supported AI providers on the server."""

    gemini_configured: bool = Field(
        description="True if GEMINI_API_KEY is present in environment"
    )
    openai_configured: bool = Field(
        description="True if OPENAI_API_KEY is present in environment"
    )
    claude_configured: bool = Field(
        description="True if ANTHROPIC_API_KEY is present in environment"
    )
    active_default: str = Field(
        description="Default provider automatically chosen if none specified"
    )


class AIConfigRequest(BaseModel):
    """Payload to configure or store an API key for a supported AI provider."""

    provider: Literal["gemini", "openai", "claude"] = Field(
        description="Target AI provider name"
    )
    api_key: str = Field(
        min_length=1,
        description="API key value for the provider",
    )
    save_to_env: bool = Field(
        default=True,
        description="Whether to persist key into local .env file",
    )


class AIConfigResponse(BaseModel):
    """Response confirming AI provider key registration."""

    provider: Literal["gemini", "openai", "claude"]
    saved_to_env: bool
    message: str


class LocationSearchResult(BaseModel):
    """Geographic location candidate resolved from text query."""

    name: str = Field(description="Primary name of city or place")
    latitude: float = Field(description="WGS84 latitude coordinate")
    longitude: float = Field(description="WGS84 longitude coordinate")
    country: str | None = Field(default=None, description="Country name")
    admin1: str | None = Field(default=None, description="Administrative region/state")
    display_name: str = Field(description="Formatted human-readable location string")

    model_config = ConfigDict(from_attributes=True)


class ReverseGeocodeResult(BaseModel):
    """Location address details resolved from coordinates."""

    display_name: str = Field(
        description="Full readable address or locality description"
    )
    city: str | None = Field(
        default=None, description="Extracted city or municipality name"
    )
    latitude: float = Field(description="WGS84 latitude")
    longitude: float = Field(description="WGS84 longitude")

    model_config = ConfigDict(from_attributes=True)
