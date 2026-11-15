"""Tests for AI Advisor recommendation service and Zero-Config deterministic fallback."""

import pytest
from app.models import Route
from app.services.ai_advisor import (
    AIRecommendation,
    get_commute_recommendation,
)
from app.services.weather import WeatherData


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
