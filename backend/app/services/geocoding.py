"""Geocoding and reverse geocoding service using OpenStreetMap Nominatim."""

import logging
from dataclasses import dataclass
from typing import Final

import httpx

logger = logging.getLogger(__name__)

NOMINATIM_SEARCH_URL: Final[str] = "https://nominatim.openstreetmap.org/search"
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


async def search_locations(
    query: str,
    count: int = 5,
    latitude: float | None = None,
    longitude: float | None = None,
) -> list[LocationItem]:
    """Search geographic locations by text query using OpenStreetMap Nominatim.

    Supports street addresses, squares, POIs, districts, and cities.
    Optionally applies proximity biasing around reference coordinates.

    Parameters
    ----------
    query : str
        Search query string (e.g. city, district, address, square).
    count : int
        Maximum number of matching candidates to return.
    latitude : float | None
        Optional reference latitude for proximity biasing.
    longitude : float | None
        Optional reference longitude for proximity biasing.

    Returns
    -------
    list[LocationItem]
        List of candidate locations with coordinates and administrative hierarchy.
    """
    clean_query = query.strip()
    if not clean_query:
        return []

    params: dict[str, str | int] = {
        "q": clean_query,
        "format": "json",
        "addressdetails": 1,
        "limit": count,
        "countrycodes": "pl",
    }

    if latitude is not None and longitude is not None:
        min_lon = longitude - 0.4
        max_lat = latitude + 0.4
        max_lon = longitude + 0.4
        min_lat = latitude - 0.4
        params["viewbox"] = f"{min_lon:.4f},{max_lat:.4f},{max_lon:.4f},{min_lat:.4f}"
        params["bounded"] = 0

    headers = {"User-Agent": NOMINATIM_USER_AGENT}

    try:
        async with httpx.AsyncClient(timeout=6.0) as client:
            response = await client.get(
                NOMINATIM_SEARCH_URL, params=params, headers=headers
            )
            response.raise_for_status()
            data = response.json()

        candidates: list[LocationItem] = []

        for item in data:
            name = (
                item.get("name")
                or item.get("display_name", clean_query).split(",")[0].strip()
            )
            lat = float(item["lat"])
            lon = float(item["lon"])
            display_name = item.get("display_name", name)
            address = item.get("address", {})
            country = address.get("country")
            admin1 = address.get("state") or address.get("county")

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
        logger.warning("Geocoding search request failed: %s", exc)
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
        logger.warning("Reverse geocoding request failed: %s", exc)
        return ReverseGeocodeItem(
            display_name=f"{latitude:.4f}, {longitude:.4f}",
            city=None,
            latitude=latitude,
            longitude=longitude,
        )
