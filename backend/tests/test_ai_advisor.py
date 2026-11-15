"""Tests for AI Advisor recommendation service and Zero-Config deterministic fallback."""

import json

import pytest
from app.models import Route
from app.schemas import AIRecommendationResponse
from app.services.ai_advisor import (
    AIRecommendation,
    get_commute_recommendation,
)
from app.services.weather import WeatherData


@pytest.mark.asyncio
async def test_zero_config_fallback_when_api_key_env_var_unset_or_empty(
    sample_medium_route: Route, monkeypatch: pytest.MonkeyPatch
):
    """When OPENAI_API_KEY is missing or empty, heuristic fallback returns valid JSON structure."""
    fair_weather = WeatherData(
        temperature_c=20.0,
        precipitation_mm=0.0,
        wind_speed_kmh=10.0,
        weather_summary="20°C, sunny",
    )

    monkeypatch.delenv("OPENAI_API_KEY", raising=False)
    rec1 = await get_commute_recommendation(sample_medium_route, fair_weather)
    assert rec1.ai_source == "heuristic_fallback"
    assert rec1.recommended_mode == "bike"

    # Verify deterministic fallback conforms to valid serialized JSON schema
    serialized_dto = AIRecommendationResponse.model_validate(rec1)
    json_payload = serialized_dto.model_dump()
    assert json_payload["ai_source"] == "heuristic_fallback"
    assert json_payload["recommended_mode"] == "bike"
    assert json_payload["estimated_duration_min"] > 0
    assert json.loads(json.dumps(json_payload)) == json_payload

    monkeypatch.setenv("OPENAI_API_KEY", "   ")
    rec2 = await get_commute_recommendation(sample_medium_route, fair_weather)
    assert rec2.ai_source == "heuristic_fallback"
    assert rec2.recommended_mode == "bike"


@pytest.mark.asyncio
async def test_zero_config_fallback_cool_and_hot_weather_conditions():
    """Cool weather (0-10°C) and hot weather (>25°C) follow active vs transit thresholds."""
    cool_weather = WeatherData(
        temperature_c=6.0,
        precipitation_mm=0.0,
        wind_speed_kmh=10.0,
        weather_summary="6°C, cool",
    )
    hot_weather = WeatherData(
        temperature_c=29.0,
        precipitation_mm=0.0,
        wind_speed_kmh=12.0,
        weather_summary="29°C, hot",
    )

    short_route = Route(
        id=10,
        name="Short",
        origin="A",
        destination="B",
        distance_km=1.8,
        preferred_transport="bike",
    )
    rec_cool_short = await get_commute_recommendation(
        short_route, cool_weather, openai_api_key=None
    )
    assert rec_cool_short.recommended_mode == "walk"

    rec_hot_short = await get_commute_recommendation(
        short_route, hot_weather, openai_api_key=None
    )
    assert rec_hot_short.recommended_mode == "walk"

    bike_route = Route(
        id=11,
        name="Bike Medium",
        origin="A",
        destination="B",
        distance_km=5.0,
        preferred_transport="bike",
    )
    rec_bike = await get_commute_recommendation(
        bike_route, cool_weather, openai_api_key=None
    )
    assert rec_bike.recommended_mode == "bike"

    transit_route = Route(
        id=12,
        name="Transit Medium",
        origin="A",
        destination="B",
        distance_km=5.0,
        preferred_transport="car",
    )
    rec_transit = await get_commute_recommendation(
        transit_route, cool_weather, openai_api_key=None
    )
    assert rec_transit.recommended_mode == "public_transit"


@pytest.mark.asyncio
async def test_zero_config_fallback_freezing_weather_preference_split():
    """In freezing weather, route over 4km with car preference chooses car, else public_transit."""
    freezing = WeatherData(
        temperature_c=-3.0,
        precipitation_mm=0.0,
        wind_speed_kmh=10.0,
        weather_summary="-3°C, freezing",
    )

    long_car_route = Route(
        id=20,
        name="Car commute",
        origin="A",
        destination="B",
        distance_km=6.0,
        preferred_transport="car",
    )
    rec_car = await get_commute_recommendation(
        long_car_route, freezing, openai_api_key=None
    )
    assert rec_car.recommended_mode == "car"

    short_car_route = Route(
        id=21,
        name="Short car commute",
        origin="A",
        destination="B",
        distance_km=3.0,
        preferred_transport="car",
    )
    rec_short = await get_commute_recommendation(
        short_car_route, freezing, openai_api_key=None
    )
    assert rec_short.recommended_mode == "public_transit"

    long_bike_route = Route(
        id=22,
        name="Long bike commute",
        origin="A",
        destination="B",
        distance_km=6.0,
        preferred_transport="bike",
    )
    rec_bike = await get_commute_recommendation(
        long_bike_route, freezing, openai_api_key=None
    )
    assert rec_bike.recommended_mode == "public_transit"


@pytest.fixture
def sample_short_route() -> Route:
    return Route(
        id=1,
        name="Krótka trasa",
        origin="Rynek",
        destination="Wawel",
        distance_km=1.5,
        preferred_transport="walk",
    )


@pytest.fixture
def sample_medium_route() -> Route:
    return Route(
        id=2,
        name="Średnia trasa",
        origin="Krowodrza",
        destination="Zabłocie",
        distance_km=6.0,
        preferred_transport="bike",
    )


@pytest.fixture
def sample_long_route() -> Route:
    return Route(
        id=3,
        name="Długa trasa",
        origin="Wieliczka",
        destination="Kraków Centrum",
        distance_km=14.0,
        preferred_transport="public_transit",
    )


@pytest.mark.asyncio
async def test_zero_config_fallback_fair_weather_short_distance(
    sample_short_route: Route,
):
    """In fair weather, short distance (<= 2.5 km) recommends walking."""
    fair_weather = WeatherData(
        temperature_c=19.0,
        precipitation_mm=0.0,
        wind_speed_kmh=10.0,
        weather_summary="19.0°C (mild), wind 10.0 km/h",
    )
    rec = await get_commute_recommendation(
        sample_short_route, fair_weather, openai_api_key=None
    )

    assert isinstance(rec, AIRecommendation)
    assert rec.recommended_mode == "walk"
    assert rec.ai_source == "heuristic_fallback"
    assert rec.potential_co2_saved_kg == round(0.17 * 1.5, 2)
    assert rec.calories_estimate == round(55 * 1.5)
    assert rec.estimated_duration_min > 0


@pytest.mark.asyncio
async def test_zero_config_fallback_fair_weather_medium_distance(
    sample_medium_route: Route,
):
    """In fair weather, medium distance (2.5 km < d <= 10 km) recommends bike."""
    fair_weather = WeatherData(
        temperature_c=21.0,
        precipitation_mm=0.0,
        wind_speed_kmh=12.0,
        weather_summary="21.0°C (mild), wind 12.0 km/h",
    )
    rec = await get_commute_recommendation(
        sample_medium_route, fair_weather, openai_api_key=None
    )

    assert rec.recommended_mode == "bike"
    assert rec.ai_source == "heuristic_fallback"
    assert rec.potential_co2_saved_kg == round(0.17 * 6.0, 2)
    assert rec.calories_estimate == round(32 * 6.0)


@pytest.mark.asyncio
async def test_zero_config_fallback_fair_weather_long_distance(
    sample_long_route: Route,
):
    """In fair weather, long distance (> 10 km) respects preferred transport."""
    fair_weather = WeatherData(
        temperature_c=20.0,
        precipitation_mm=0.0,
        wind_speed_kmh=10.0,
        weather_summary="20.0°C (mild), wind 10.0 km/h",
    )
    rec = await get_commute_recommendation(
        sample_long_route, fair_weather, openai_api_key=None
    )

    assert rec.recommended_mode == "public_transit"
    assert rec.ai_source == "heuristic_fallback"


@pytest.mark.asyncio
async def test_zero_config_fallback_rain_threshold_above_4km():
    """In rain, distance > 4.0 km recommends car when car is preferred."""
    car_route = Route(
        id=4,
        name="Trasa samochodowa",
        origin="A",
        destination="B",
        distance_km=5.0,
        preferred_transport="car",
    )
    rainy_weather = WeatherData(
        temperature_c=12.0,
        precipitation_mm=2.5,
        wind_speed_kmh=10.0,
        weather_summary="12°C, rain",
    )
    rec = await get_commute_recommendation(
        car_route, rainy_weather, openai_api_key=None
    )
    assert rec.recommended_mode == "car"


@pytest.mark.asyncio
async def test_zero_config_fallback_rainy_weather_discourages_bike_and_walk(
    sample_medium_route: Route,
):
    """In rain, bike and walk are discouraged in favor of public transit or car."""
    rainy_weather = WeatherData(
        temperature_c=12.0,
        precipitation_mm=4.0,
        wind_speed_kmh=15.0,
        weather_summary="12.0°C (4.0 mm rain), wind 15.0 km/h",
    )
    rec = await get_commute_recommendation(
        sample_medium_route, rainy_weather, openai_api_key=None
    )

    assert rec.recommended_mode in ("public_transit", "car")
    assert rec.recommended_mode not in ("bike", "walk")
    assert "deszcz" in rec.reasoning.lower() or "rain" in rec.reasoning.lower()


@pytest.mark.asyncio
async def test_zero_config_fallback_freezing_weather(sample_medium_route: Route):
    """Sub-zero temperature suggests indoor transport for thermal comfort."""
    freezing_weather = WeatherData(
        temperature_c=-5.0,
        precipitation_mm=0.0,
        wind_speed_kmh=12.0,
        weather_summary="-5.0°C (freezing), wind 12.0 km/h",
    )
    rec = await get_commute_recommendation(
        sample_medium_route, freezing_weather, openai_api_key=None
    )

    assert rec.recommended_mode in ("public_transit", "car")
    assert (
        "mróz" in rec.reasoning.lower()
        or "mroz" in rec.reasoning.lower()
        or "cold" in rec.reasoning.lower()
    )


@pytest.mark.asyncio
async def test_zero_config_fallback_strong_wind_discourages_biking(
    sample_medium_route: Route,
):
    """Strong wind (> 35 km/h) discourages biking."""
    windy_weather = WeatherData(
        temperature_c=15.0,
        precipitation_mm=0.0,
        wind_speed_kmh=45.0,
        weather_summary="15.0°C (strong wind), wind 45.0 km/h",
    )
    rec = await get_commute_recommendation(
        sample_medium_route, windy_weather, openai_api_key=None
    )

    assert rec.recommended_mode != "bike"
    assert "wiatr" in rec.reasoning.lower() or "wind" in rec.reasoning.lower()


@pytest.mark.asyncio
async def test_llm_recommendation_success(
    sample_medium_route: Route, monkeypatch: pytest.MonkeyPatch
):
    """When OpenAI responds with valid structured JSON, ai_source is 'llm'."""
    fair_weather = WeatherData(
        temperature_c=18.0,
        precipitation_mm=0.0,
        wind_speed_kmh=10.0,
        weather_summary="18.0°C (mild), wind 10.0 km/h",
    )

    import httpx

    async def mock_handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(
            200,
            json={
                "choices": [
                    {
                        "message": {
                            "content": (
                                '{"recommended_mode": "bike", '
                                '"reasoning": "Rekomendacja z modelu LLM.", '
                                '"estimated_duration_min": 25}'
                            )
                        }
                    }
                ]
            },
        )

    # Patch AsyncClient to use mock transport
    real_async_client = httpx.AsyncClient

    def mocked_async_client(*args, **kwargs):
        kwargs["transport"] = httpx.MockTransport(mock_handler)
        return real_async_client(*args, **kwargs)

    monkeypatch.setattr(httpx, "AsyncClient", mocked_async_client)

    rec = await get_commute_recommendation(
        sample_medium_route, fair_weather, openai_api_key="sk-test-mock-key"
    )

    assert rec.recommended_mode == "bike"
    assert rec.ai_source == "llm"
    assert rec.reasoning == "Rekomendacja z modelu LLM."
    assert rec.estimated_duration_min == 25


@pytest.mark.asyncio
async def test_llm_recommendation_graceful_fallback_on_api_error(
    sample_medium_route: Route, monkeypatch: pytest.MonkeyPatch
):
    """When OpenAI raises an error, it gracefully falls back to heuristic."""
    fair_weather = WeatherData(
        temperature_c=18.0,
        precipitation_mm=0.0,
        wind_speed_kmh=10.0,
        weather_summary="18.0°C (mild), wind 10.0 km/h",
    )

    import httpx

    async def failing_handler(request: httpx.Request) -> httpx.Response:
        raise httpx.ConnectError("OpenAI unreachable")

    real_async_client = httpx.AsyncClient

    def mocked_async_client(*args, **kwargs):
        kwargs["transport"] = httpx.MockTransport(failing_handler)
        return real_async_client(*args, **kwargs)

    monkeypatch.setattr(httpx, "AsyncClient", mocked_async_client)

    rec = await get_commute_recommendation(
        sample_medium_route, fair_weather, openai_api_key="sk-test-mock-key"
    )

    assert rec.ai_source == "heuristic_fallback"
    assert rec.recommended_mode == "bike"


@pytest.mark.asyncio
async def test_gemini_recommendation_success(
    sample_medium_route: Route, monkeypatch: pytest.MonkeyPatch
):
    """When Gemini responds with valid structured JSON, ai_source is 'gemini'."""
    fair_weather = WeatherData(
        temperature_c=18.0,
        precipitation_mm=0.0,
        wind_speed_kmh=10.0,
        weather_summary="18.0°C (mild), wind 10.0 km/h",
    )

    import httpx

    async def mock_handler(request: httpx.Request) -> httpx.Response:
        assert "generativelanguage.googleapis.com" in str(request.url)
        return httpx.Response(
            200,
            json={
                "candidates": [
                    {
                        "content": {
                            "parts": [
                                {
                                    "text": (
                                        '{"recommended_mode": "bike", '
                                        '"reasoning": "Rekomendacja Google Gemini.", '
                                        '"estimated_duration_min": 22}'
                                    )
                                }
                            ]
                        }
                    }
                ]
            },
        )

    real_async_client = httpx.AsyncClient

    def mocked_async_client(*args, **kwargs):
        kwargs["transport"] = httpx.MockTransport(mock_handler)
        return real_async_client(*args, **kwargs)

    monkeypatch.setattr(httpx, "AsyncClient", mocked_async_client)

    rec = await get_commute_recommendation(
        sample_medium_route,
        fair_weather,
        gemini_api_key="AIzaSyMockKey",
        preferred_provider="gemini",
    )

    assert rec.ai_source == "gemini"
    assert rec.provider == "gemini"
    assert rec.recommended_mode == "bike"
    assert rec.reasoning == "Rekomendacja Google Gemini."
    assert rec.estimated_duration_min == 22


@pytest.mark.asyncio
async def test_claude_recommendation_success(
    sample_medium_route: Route, monkeypatch: pytest.MonkeyPatch
):
    """When Claude responds with valid structured JSON, ai_source is 'claude'."""
    fair_weather = WeatherData(
        temperature_c=18.0,
        precipitation_mm=0.0,
        wind_speed_kmh=10.0,
        weather_summary="18.0°C (mild), wind 10.0 km/h",
    )

    import httpx

    async def mock_handler(request: httpx.Request) -> httpx.Response:
        assert "api.anthropic.com" in str(request.url)
        return httpx.Response(
            200,
            json={
                "content": [
                    {
                        "type": "text",
                        "text": (
                            '```json\n{"recommended_mode": "walk", '
                            '"reasoning": "Rekomendacja Claude.", '
                            '"estimated_duration_min": 18}\n```'
                        ),
                    }
                ]
            },
        )

    real_async_client = httpx.AsyncClient

    def mocked_async_client(*args, **kwargs):
        kwargs["transport"] = httpx.MockTransport(mock_handler)
        return real_async_client(*args, **kwargs)

    monkeypatch.setattr(httpx, "AsyncClient", mocked_async_client)

    rec = await get_commute_recommendation(
        sample_medium_route,
        fair_weather,
        claude_api_key="sk-ant-mock",
        preferred_provider="claude",
    )

    assert rec.ai_source == "claude"
    assert rec.provider == "claude"
    assert rec.recommended_mode == "walk"
    assert rec.reasoning == "Rekomendacja Claude."
    assert rec.estimated_duration_min == 18
