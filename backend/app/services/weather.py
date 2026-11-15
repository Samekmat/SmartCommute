"""Weather service fetching live Open-Meteo forecasts with simulator presets and fallback."""

import logging
from dataclasses import dataclass
from typing import Final, Literal

import httpx

logger = logging.getLogger(__name__)

WeatherSimulatorCondition = Literal["rain", "sunny", "windy", "cold"]
# Alias retained for REST API request payload compatibility
WeatherOverride = WeatherSimulatorCondition
VALID_SIMULATOR_CONDITIONS: Final[set[str]] = {"rain", "sunny", "windy", "cold"}
VALID_WEATHER_OVERRIDES: Final[set[str]] = VALID_SIMULATOR_CONDITIONS

OPEN_METEO_API_URL: Final[str] = "https://api.open-meteo.com/v1/forecast"


@dataclass(frozen=True, slots=True)
class WeatherData:
    """Current weather observations or simulated atmospheric conditions."""

    temperature_c: float
    precipitation_mm: float
    wind_speed_kmh: float
    weather_summary: str
    is_simulated: bool = False


# Synthetic fair weather used when external weather API is unreachable or times out
FALLBACK_WEATHER: Final[WeatherData] = WeatherData(
    temperature_c=18.0,
    precipitation_mm=0.0,
    wind_speed_kmh=12.0,
    weather_summary="Fair weather (offline fallback), 18°C, wind 12 km/h",
    is_simulated=True,
)

# Weather Simulator presets enabling instant evaluation of diverse weather conditions
SIMULATED_WEATHER_PRESETS: Final[dict[WeatherOverride, WeatherData]] = {
    "rain": WeatherData(
        temperature_c=12.0,
        precipitation_mm=3.5,
        wind_speed_kmh=15.0,
        weather_summary="Rainy (simulated), 12°C, 3.5 mm precipitation, wind 15 km/h",
        is_simulated=True,
    ),
    "sunny": WeatherData(
        temperature_c=22.0,
        precipitation_mm=0.0,
        wind_speed_kmh=8.0,
        weather_summary="Sunny (simulated), 22°C, clear sky, wind 8 km/h",
        is_simulated=True,
    ),
    "windy": WeatherData(
        temperature_c=14.0,
        precipitation_mm=0.0,
        wind_speed_kmh=42.0,
        weather_summary="Windy (simulated), 14°C, strong wind 42 km/h",
        is_simulated=True,
    ),
    "cold": WeatherData(
        temperature_c=-4.0,
        precipitation_mm=0.0,
        wind_speed_kmh=10.0,
        weather_summary="Freezing Cold (simulated), -4°C, wind 10 km/h",
        is_simulated=True,
    ),
}


def _format_weather_summary(temp: float, precip: float, wind: float) -> str:
    """Construct human-readable weather overview string."""
    conditions = []
    if precip > 0.5:
        conditions.append(f"{precip:.1f} mm rain")
    elif temp < 0:
        conditions.append("freezing")
    elif temp > 22:
        conditions.append("warm and clear")
    else:
        conditions.append("mild")

    if wind > 35:
        conditions.append("strong wind")

    conditions_str = ", ".join(conditions)
    return f"{temp:.1f}°C ({conditions_str}), wind {wind:.1f} km/h"


async def fetch_weather(
    latitude: float,
    longitude: float,
    weather_override: WeatherOverride | None = None,
    client: httpx.AsyncClient | None = None,
) -> WeatherData:
    """Fetch current weather from Open-Meteo or return simulator preset.

    Parameters
    ----------
    latitude : float
        Latitude coordinate.
    longitude : float
        Longitude coordinate.
    weather_override : WeatherOverride | None
        Optional simulator override ('rain', 'sunny', 'windy', 'cold').
    client : httpx.AsyncClient | None
        Optional HTTP client for dependency injection during testing.

    Returns
    -------
    WeatherData
        Parsed current weather data or synthetic fallback.

    Raises
    ------
    ValueError
        If weather_override is not in VALID_WEATHER_OVERRIDES.
    """
    if weather_override is not None:
        if weather_override not in VALID_WEATHER_OVERRIDES:
            raise ValueError(
                f"Invalid weather override '{weather_override}'. Expected one of {VALID_WEATHER_OVERRIDES}"
            )
        return SIMULATED_WEATHER_PRESETS[weather_override]

    params = {
        "latitude": latitude,
        "longitude": longitude,
        "current": "temperature_2m,precipitation,wind_speed_10m",
    }

    try:
        if client is not None:
            response = await client.get(OPEN_METEO_API_URL, params=params, timeout=5.0)
        else:
            async with httpx.AsyncClient(timeout=5.0) as http_client:
                response = await http_client.get(OPEN_METEO_API_URL, params=params)

        response.raise_for_status()
        data = response.json()
        current = data.get("current", {})

        temperature = float(current.get("temperature_2m", 18.0))
        precipitation = float(current.get("precipitation", 0.0))
        wind_speed = float(current.get("wind_speed_10m", 12.0))

        summary = _format_weather_summary(temperature, precipitation, wind_speed)

        return WeatherData(
            temperature_c=temperature,
            precipitation_mm=precipitation,
            wind_speed_kmh=wind_speed,
            weather_summary=summary,
            is_simulated=False,
        )
    except (httpx.HTTPError, ValueError, KeyError) as exc:
        logger.warning(
            "Failed to fetch live weather from Open-Meteo: %s. Using graceful fallback.",
            exc,
        )
        return FALLBACK_WEATHER
