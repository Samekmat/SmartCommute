"""Geocoding and reverse geocoding service using Open-Meteo and OpenStreetMap."""

import logging
from dataclasses import dataclass
from typing import Final

import httpx

logger = logging.getLogger(__name__)

OPEN_METEO_GEOCODING_URL: Final[str] = "https://geocoding-api.open-meteo.com/v1/search"
NOMINATIM_REVERSE_URL: Final[str] = "https://nominatim.openstreetmap.org/reverse"
NOMINATIM_USER_AGENT: Final[str] = "SmartCommute/1.0 (contact: samekmat@gmail.com)"


@dataclass(frozen=True, slots=True)
class LocationItem:
    """Resolved geographic location candidate."""

    name: str
    latitude: float
    longitude: float
    country: str | None
    admin1: str | None
    display_name: str


@dataclass(frozen=True, slots=True)
class ReverseGeocodeItem:
    """Address details resolved from GPS coordinates."""

    display_name: str
    city: str | None
    latitude: float
    longitude: float


async def search_locations(query: str, count: int = 5) -> list[LocationItem]:
    """Search geographic locations by text query using Open-Meteo Geocoding API.

    Parameters
    ----------
    query : str
        Search query string (e.g. city name, district, address).
    count : int
        Maximum number of matching candidates to return.

    Returns
    -------
    list[LocationItem]
        List of candidate locations with latitude and longitude.
    """
    clean_query = query.strip()
    if not clean_query:
        return []

    params = {
        "name": clean_query,
        "count": count,
        "language": "pl",
        "format": "json",
    }

    try:
        async with httpx.AsyncClient(timeout=6.0) as client:
            response = await client.get(OPEN_METEO_GEOCODING_URL, params=params)
            response.raise_for_status()
            data = response.json()

        results = data.get("results", [])
        candidates: list[LocationItem] = []

        for item in results:
            name = item.get("name", clean_query)
            lat = float(item["latitude"])
            lon = float(item["longitude"])
            country = item.get("country")
            admin1 = item.get("admin1")

            parts = [name]
            if admin1 and admin1 != name:
                parts.append(admin1)
            if country:
                parts.append(country)

            display_name = ", ".join(parts)

            candidates.append(
                LocationItem(
                    name=name,
                    latitude=lat,
                    longitude=lon,
                    country=country,
                    admin1=admin1,
                    display_name=display_name,
                )
            )

        return candidates
    except (httpx.HTTPError, KeyError, ValueError) as exc:
        logger.warning("Geocoding search failed for query '%s': %s", clean_query, exc)
        return []


async def reverse_geocode(latitude: float, longitude: float) -> ReverseGeocodeItem:
    """Resolve human-readable place description from latitude and longitude.

    Parameters
    ----------
    latitude : float
        WGS84 latitude coordinate.
    longitude : float
        WGS84 longitude coordinate.

    Returns
    -------
    ReverseGeocodeItem
        Address or place name for the given coordinate.
    """
    params = {
        "lat": latitude,
        "lon": longitude,
        "format": "json",
        "accept-language": "pl",
    }
    headers = {"User-Agent": NOMINATIM_USER_AGENT}

    try:
        async with httpx.AsyncClient(timeout=6.0) as client:
            response = await client.get(
                NOMINATIM_REVERSE_URL, params=params, headers=headers
            )
            response.raise_for_status()
            data = response.json()

        display_name = data.get("display_name", f"{latitude:.4f}, {longitude:.4f}")
        address_dict = data.get("address", {})
        city = (
            address_dict.get("city")
            or address_dict.get("town")
            or address_dict.get("village")
            or address_dict.get("suburb")
        )

        return ReverseGeocodeItem(
            display_name=display_name,
            city=city,
            latitude=latitude,
            longitude=longitude,
        )
    except (httpx.HTTPError, KeyError, ValueError) as exc:
        logger.warning(
            "Reverse geocoding failed for (%s, %s): %s", latitude, longitude, exc
        )
        return ReverseGeocodeItem(
            display_name=f"{latitude:.4f}, {longitude:.4f}",
            city=None,
            latitude=latitude,
            longitude=longitude,
        )
