"""Tests for Open-Meteo weather client and Weather Simulator overrides."""

import httpx
import pytest
from app.services.weather import (
    FALLBACK_WEATHER,
    fetch_weather,
)


@pytest.mark.asyncio
async def test_fetch_weather_with_rain_override():
    """Weather override 'rain' produces high precipitation without network requests."""
    weather = await fetch_weather(50.06, 19.94, weather_override="rain")
    assert weather.is_simulated is True
    assert weather.precipitation_mm > 0.5
    assert "rain" in weather.weather_summary.lower()


@pytest.mark.asyncio
async def test_fetch_weather_with_sunny_override():
    """Weather override 'sunny' produces mild temperature and zero precipitation."""
    weather = await fetch_weather(50.06, 19.94, weather_override="sunny")
    assert weather.is_simulated is True
    assert weather.precipitation_mm == 0.0
    assert 15.0 <= weather.temperature_c <= 30.0


@pytest.mark.asyncio
async def test_fetch_weather_with_windy_override():
    """Weather override 'windy' produces wind speed above 35 km/h."""
    weather = await fetch_weather(50.06, 19.94, weather_override="windy")
    assert weather.is_simulated is True
    assert weather.wind_speed_kmh > 35.0


@pytest.mark.asyncio
async def test_fetch_weather_with_cold_override():
    """Weather override 'cold' produces sub-zero temperature."""
    weather = await fetch_weather(50.06, 19.94, weather_override="cold")
    assert weather.is_simulated is True
    assert weather.temperature_c < 0.0


@pytest.mark.asyncio
async def test_fetch_weather_live_api_success():
    """Live API response is parsed correctly into WeatherData."""

    async def mock_handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(
            200,
            json={
                "current": {
                    "temperature_2m": 16.5,
                    "precipitation": 0.2,
                    "wind_speed_10m": 14.1,
                }
            },
        )

    transport = httpx.MockTransport(mock_handler)
    async with httpx.AsyncClient(transport=transport) as client:
        weather = await fetch_weather(50.0647, 19.9450, client=client)

    assert weather.temperature_c == 16.5
    assert weather.precipitation_mm == 0.2
    assert weather.wind_speed_kmh == 14.1
    assert weather.is_simulated is False
    assert "16.5°C" in weather.weather_summary


@pytest.mark.asyncio
async def test_fetch_weather_graceful_fallback_on_network_error():
    """Network failure returns synthetic fair weather fallback without raising an error."""

    async def failing_handler(request: httpx.Request) -> httpx.Response:
        raise httpx.ConnectError("Network unreachable")

    transport = httpx.MockTransport(failing_handler)
    async with httpx.AsyncClient(transport=transport) as client:
        weather = await fetch_weather(50.0647, 19.9450, client=client)

    assert weather == FALLBACK_WEATHER
    assert weather.temperature_c == 18.0
    assert weather.precipitation_mm == 0.0
    assert weather.wind_speed_kmh == 12.0
    assert weather.is_simulated is True


@pytest.mark.asyncio
async def test_fetch_weather_rejects_unknown_override():
    """Invalid weather override name raises ValueError."""
    with pytest.raises(ValueError, match="Invalid weather override"):
        await fetch_weather(50.06, 19.94, weather_override="tornado")  # type: ignore[arg-type]
