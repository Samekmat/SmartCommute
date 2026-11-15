"""AI Advisor commute recommendation service supporting Gemini, OpenAI, Claude and Zero-Config fallback."""

import json
import logging
import os
from dataclasses import dataclass
from typing import Any, Final, Literal

import httpx

from app.models import Route, TransportMode
from app.services.eco_calc import calculate_eco_metrics
from app.services.weather import WeatherData

logger = logging.getLogger(__name__)

AISource = Literal["llm", "heuristic_fallback", "gemini", "openai", "claude"]
LLMProvider = Literal["auto", "gemini", "openai", "claude"]


@dataclass(frozen=True, slots=True)
class AIRecommendation:
    """Structured commute transport recommendation with contextual rationale."""

    recommended_mode: TransportMode
    weather_summary: str
    reasoning: str
    estimated_duration_min: int
    potential_co2_saved_kg: float
    calories_estimate: int
    ai_source: AISource
    provider: str | None = None


def _estimate_duration_minutes(mode: TransportMode, distance_km: float) -> int:
    """Estimate commute duration based on transport mode and distance."""
    if mode == "walk":
        # Average walking speed ~4.8 km/h
        return max(1, round(distance_km / 4.8 * 60))
    if mode == "bike":
        # Average city cycling speed ~16 km/h
        return max(1, round(distance_km / 16.0 * 60))
    if mode == "public_transit":
        # Average transit speed ~22 km/h plus 5-min waiting buffer
        return max(5, round(distance_km / 22.0 * 60) + 5)
    if mode == "car":
        # Urban traffic ~35 km/h plus 3-min parking/setup
        return max(3, round(distance_km / 35.0 * 60) + 3)

    # Fallback estimation for unexpected transport mode (~20 km/h)
    return max(1, round(distance_km / 20.0 * 60))


def _heuristic_recommendation(route: Route, weather: WeatherData) -> AIRecommendation:
    """Compute deterministic recommendation based on domain rules and weather."""
    distance = route.distance_km

    # 1. Rain condition: discourage bike and walk
    if weather.precipitation_mm > 0.5:
        mode: TransportMode = (
            "public_transit"
            if distance <= 4.0 or route.preferred_transport != "car"
            else "car"
        )
        reasoning = (
            f"Z powodu opadów deszczu ({weather.precipitation_mm:.1f} mm) odradzamy spacer i rower. "
            f"Optymalnym wyborem będzie {('komunikacja miejska' if mode == 'public_transit' else 'samochód')}."
        )
    # 2. Freezing cold: prioritize thermal comfort
    elif weather.temperature_c < 0.0:
        mode = (
            "car"
            if route.preferred_transport == "car" and distance > 4.0
            else "public_transit"
        )
        reasoning = (
            f"Z uwagi na panujący mróz ({weather.temperature_c:.1f}°C) zalecamy "
            f"{('samochód' if mode == 'car' else 'komunikację miejską')} dla komfortu termicznego."
        )
    # 3. Strong wind: warn against biking, prefer public transit
    elif weather.wind_speed_kmh > 35.0:
        mode = "public_transit"
        reasoning = (
            f"Porywisty wiatr ({weather.wind_speed_kmh:.1f} km/h) stwarza opór i ryzyko na rowerze. "
            "Zalecamy bezpieczną komunikację miejską."
        )
    # 4. Fair weather (10°C to 25°C, no rain)
    elif 10.0 <= weather.temperature_c <= 25.0:
        if distance <= 2.5:
            mode = "walk"
            reasoning = (
                f"Wyśmienita pogoda ({weather.temperature_c:.1f}°C, bez opadów) na spacer "
                "– pełna redukcja emisji i zdrowy ruch!"
            )
        elif distance <= 10.0:
            mode = "bike"
            reasoning = (
                f"Doskonałe warunki ({weather.temperature_c:.1f}°C, lekki wiatr) na rower "
                "– sprawny czas dojazdu, zerowa emisja i spalanie kalorii."
            )
        else:
            mode = (
                route.preferred_transport
                if route.preferred_transport in ("public_transit", "car")
                else "public_transit"
            )
            reasoning = (
                f"Dłuższy dystans ({distance:.1f} km) najlepiej pokonać za pomocą: "
                f"{('komunikacji miejskiej' if mode == 'public_transit' else 'samochodu')}."
            )
    # 5. Cool weather (0°C to 10°C, no rain) or Hot weather (> 25°C)
    else:
        if distance <= 2.0:
            mode = "walk"
            reasoning = (
                f"Temperatura {weather.temperature_c:.1f}°C sprzyja krótkiemu spacerowi "
                "przy odpowiednim ubiorze."
            )
        elif distance <= 8.0:
            mode = "bike" if route.preferred_transport == "bike" else "public_transit"
            reasoning = (
                f"Przy temperaturze {weather.temperature_c:.1f}°C rekomendujemy "
                f"{('rower' if mode == 'bike' else 'komunikację miejską')}."
            )
        else:
            mode = (
                route.preferred_transport
                if route.preferred_transport in ("public_transit", "car")
                else "public_transit"
            )
            reasoning = (
                f"Na dystansie {distance:.1f} km przy {weather.temperature_c:.1f}°C "
                f"najwygodniejszy będzie {('komunikacja miejska' if mode == 'public_transit' else 'samochód')}."
            )

    eco = calculate_eco_metrics(mode, distance)
    duration = _estimate_duration_minutes(mode, distance)

    return AIRecommendation(
        recommended_mode=mode,
        weather_summary=weather.weather_summary,
        reasoning=reasoning,
        estimated_duration_min=duration,
        potential_co2_saved_kg=eco.co2_saved_kg,
        calories_estimate=eco.calories_burned,
        ai_source="heuristic_fallback",
        provider="heuristic_fallback",
    )


def _clean_json_content(raw: str) -> str:
    """Strip markdown code fence blocks if returned by the LLM."""
    cleaned = raw.strip()
    if cleaned.startswith("```"):
        lines = cleaned.splitlines()
        if len(lines) >= 2:
            cleaned = "\n".join(lines[1:])
        cleaned = cleaned.removesuffix("```")
    return cleaned.strip()


def _build_prompt(route: Route, weather: WeatherData) -> str:
    """Construct prompt for structured LLM commute recommendation."""
    return (
        f"Route: '{route.name}' from '{route.origin}' to '{route.destination}', distance {route.distance_km} km. "
        f"Preferred transport: {route.preferred_transport}. "
        f"Current weather: temperature {weather.temperature_c}°C, precipitation {weather.precipitation_mm} mm, "
        f"wind speed {weather.wind_speed_kmh} km/h. Summary: {weather.weather_summary}.\n"
        "Recommend the single best transport mode among: 'car', 'bike', 'public_transit', 'walk'. "
        "Respond strictly in JSON format with keys:\n"
        "- recommended_mode: one of 'car', 'bike', 'public_transit', 'walk'\n"
        "- reasoning: 1-2 sentences in Polish explaining the choice based on weather and route distance\n"
        "- estimated_duration_min: estimated integer minutes"
    )


OPENAI_COMPLETIONS_URL: Final[str] = "https://api.openai.com/v1/chat/completions"
GEMINI_GENERATE_URL: Final[str] = (
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent"
)
CLAUDE_MESSAGES_URL: Final[str] = "https://api.anthropic.com/v1/messages"


async def _query_openai_recommendation(
    route: Route, weather: WeatherData, api_key: str
) -> AIRecommendation:
    """Request structured recommendation from OpenAI LLM."""
    prompt = _build_prompt(route, weather)
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": "gpt-4o-mini",
        "messages": [
            {
                "role": "system",
                "content": "You are SmartCommute AI advisor recommending eco-friendly transport modes based on live weather.",
            },
            {"role": "user", "content": prompt},
        ],
        "response_format": {"type": "json_object"},
        "temperature": 0.2,
    }

    async with httpx.AsyncClient(timeout=8.0) as client:
        response = await client.post(
            OPENAI_COMPLETIONS_URL, headers=headers, json=payload
        )
        response.raise_for_status()
        data = response.json()
        content = data["choices"][0]["message"]["content"]
        parsed = json.loads(_clean_json_content(content))

    mode: TransportMode = parsed["recommended_mode"]
    reasoning: str = parsed.get("reasoning", "Rekomendacja AI.")
    duration: int = int(parsed.get("estimated_duration_min", 20))
    eco = calculate_eco_metrics(mode, route.distance_km)

    return AIRecommendation(
        recommended_mode=mode,
        weather_summary=weather.weather_summary,
        reasoning=reasoning,
        estimated_duration_min=max(1, duration),
        potential_co2_saved_kg=eco.co2_saved_kg,
        calories_estimate=eco.calories_burned,
        ai_source="llm",
        provider="openai",
    )


async def _query_gemini_recommendation(
    route: Route, weather: WeatherData, api_key: str
) -> AIRecommendation:
    """Request structured recommendation from Google Gemini."""
    prompt = _build_prompt(route, weather)
    url = f"{GEMINI_GENERATE_URL}?key={api_key}"
    headers = {"Content-Type": "application/json"}
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "responseMimeType": "application/json",
            "temperature": 0.2,
        },
    }

    async with httpx.AsyncClient(timeout=8.0) as client:
        response = await client.post(url, headers=headers, json=payload)
        response.raise_for_status()
        data = response.json()
        raw_text = data["candidates"][0]["content"]["parts"][0]["text"]
        parsed = json.loads(_clean_json_content(raw_text))

    mode: TransportMode = parsed["recommended_mode"]
    reasoning: str = parsed.get("reasoning", "Rekomendacja Google Gemini.")
    duration: int = int(parsed.get("estimated_duration_min", 20))
    eco = calculate_eco_metrics(mode, route.distance_km)

    return AIRecommendation(
        recommended_mode=mode,
        weather_summary=weather.weather_summary,
        reasoning=reasoning,
        estimated_duration_min=max(1, duration),
        potential_co2_saved_kg=eco.co2_saved_kg,
        calories_estimate=eco.calories_burned,
        ai_source="gemini",
        provider="gemini",
    )


async def _query_claude_recommendation(
    route: Route, weather: WeatherData, api_key: str
) -> AIRecommendation:
    """Request structured recommendation from Anthropic Claude."""
    prompt = _build_prompt(route, weather)
    headers = {
        "x-api-key": api_key,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
    }
    payload = {
        "model": "claude-3-5-haiku-20241022",
        "max_tokens": 500,
        "temperature": 0.2,
        "system": (
            "You are SmartCommute AI advisor recommending eco-friendly transport modes "
            "based on live weather. Respond strictly in valid JSON format without markdown fences."
        ),
        "messages": [{"role": "user", "content": prompt}],
    }

    async with httpx.AsyncClient(timeout=8.0) as client:
        response = await client.post(CLAUDE_MESSAGES_URL, headers=headers, json=payload)
        response.raise_for_status()
        data = response.json()
        raw_text = data["content"][0]["text"]
        parsed = json.loads(_clean_json_content(raw_text))

    mode: TransportMode = parsed["recommended_mode"]
    reasoning: str = parsed.get("reasoning", "Rekomendacja Claude.")
    duration: int = int(parsed.get("estimated_duration_min", 20))
    eco = calculate_eco_metrics(mode, route.distance_km)

    return AIRecommendation(
        recommended_mode=mode,
        weather_summary=weather.weather_summary,
        reasoning=reasoning,
        estimated_duration_min=max(1, duration),
        potential_co2_saved_kg=eco.co2_saved_kg,
        calories_estimate=eco.calories_burned,
        ai_source="claude",
        provider="claude",
    )


def get_ai_status() -> dict[str, Any]:
    """Inspect environment configuration and determine active AI provider status."""
    gemini_key = os.getenv("GEMINI_API_KEY", "").strip()
    openai_key = os.getenv("OPENAI_API_KEY", "").strip()
    claude_key = os.getenv("ANTHROPIC_API_KEY", "").strip()

    active_default = "heuristic_fallback"
    if gemini_key:
        active_default = "gemini"
    elif openai_key:
        active_default = "openai"
    elif claude_key:
        active_default = "claude"

    return {
        "gemini_configured": bool(gemini_key),
        "openai_configured": bool(openai_key),
        "claude_configured": bool(claude_key),
        "active_default": active_default,
    }


async def get_commute_recommendation(
    route: Route,
    weather: WeatherData,
    openai_api_key: str | None = None,
    gemini_api_key: str | None = None,
    claude_api_key: str | None = None,
    preferred_provider: LLMProvider = "auto",
) -> AIRecommendation:
    """Generate commute recommendation via LLM if key present, else Zero-Config fallback.

    Parameters
    ----------
    route : Route
        The commute route entity.
    weather : WeatherData
        Live or simulated atmospheric conditions.
    openai_api_key : str | None
        Optional OpenAI API key; defaults to OPENAI_API_KEY environment variable.
    gemini_api_key : str | None
        Optional Google Gemini API key; defaults to GEMINI_API_KEY environment variable.
    claude_api_key : str | None
        Optional Anthropic Claude API key; defaults to ANTHROPIC_API_KEY environment variable.
    preferred_provider : LLMProvider
        Preferred provider ('auto', 'gemini', 'openai', 'claude').

    Returns
    -------
    AIRecommendation
        Complete structured recommendation with justification and eco impact.
    """
    eff_gemini = (
        gemini_api_key
        if gemini_api_key is not None
        else os.getenv("GEMINI_API_KEY", "").strip()
    )
    eff_openai = (
        openai_api_key
        if openai_api_key is not None
        else os.getenv("OPENAI_API_KEY", "").strip()
    )
    eff_claude = (
        claude_api_key
        if claude_api_key is not None
        else os.getenv("ANTHROPIC_API_KEY", "").strip()
    )

    # 1. Direct provider selection
    if preferred_provider == "gemini" and eff_gemini:
        try:
            return await _query_gemini_recommendation(route, weather, eff_gemini)
        except (httpx.HTTPError, json.JSONDecodeError, KeyError, ValueError) as exc:
            err_detail = getattr(getattr(exc, "response", None), "text", str(exc))
            logger.warning("Gemini recommendation failed (%s); fallback.", err_detail)

    if preferred_provider == "openai" and eff_openai:
        try:
            return await _query_openai_recommendation(route, weather, eff_openai)
        except (httpx.HTTPError, json.JSONDecodeError, KeyError, ValueError) as exc:
            err_detail = getattr(getattr(exc, "response", None), "text", str(exc))
            logger.warning("OpenAI recommendation failed (%s); fallback.", err_detail)

    if preferred_provider == "claude" and eff_claude:
        try:
            return await _query_claude_recommendation(route, weather, eff_claude)
        except (httpx.HTTPError, json.JSONDecodeError, KeyError, ValueError) as exc:
            err_detail = getattr(getattr(exc, "response", None), "text", str(exc))
            logger.warning("Claude recommendation failed (%s); fallback.", err_detail)

    # 2. Auto selection order
    if preferred_provider == "auto":
        # If openai key was explicitly provided (e.g. In unit tests), honor it first
        if openai_api_key and openai_api_key.strip():
            try:
                return await _query_openai_recommendation(
                    route, weather, openai_api_key.strip()
                )
            except (httpx.HTTPError, json.JSONDecodeError, KeyError, ValueError) as exc:
                err_detail = getattr(getattr(exc, "response", None), "text", str(exc))
                logger.warning(
                    "OpenAI recommendation failed (%s); fallback.", err_detail
                )

        # Then Google Gemini (free tier first)
        if eff_gemini:
            try:
                return await _query_gemini_recommendation(route, weather, eff_gemini)
            except (httpx.HTTPError, json.JSONDecodeError, KeyError, ValueError) as exc:
                err_detail = getattr(getattr(exc, "response", None), "text", str(exc))
                logger.warning(
                    "Gemini recommendation failed (%s); fallback.", err_detail
                )

        # Then OpenAI
        if eff_openai:
            try:
                return await _query_openai_recommendation(route, weather, eff_openai)
            except (httpx.HTTPError, json.JSONDecodeError, KeyError, ValueError) as exc:
                err_detail = getattr(getattr(exc, "response", None), "text", str(exc))
                logger.warning(
                    "OpenAI recommendation failed (%s); fallback.", err_detail
                )

        # Then Claude
        if eff_claude:
            try:
                return await _query_claude_recommendation(route, weather, eff_claude)
            except (httpx.HTTPError, json.JSONDecodeError, KeyError, ValueError) as exc:
                err_detail = getattr(getattr(exc, "response", None), "text", str(exc))
                logger.warning(
                    "Claude recommendation failed (%s); fallback.", err_detail
                )

    # 3. Deterministic Zero-Config heuristic fallback
    return _heuristic_recommendation(route, weather)
