"""FastAPI router for geocoding address resolution and reverse geocoding."""

from fastapi import APIRouter, Query

from app.schemas import LocationSearchResult, ReverseGeocodeResult
from app.services.geocoding import reverse_geocode, search_locations

router = APIRouter(prefix="/api/geocoding", tags=["Geocoding"])


@router.get("/search", response_model=list[LocationSearchResult])
async def search_places(
    q: str = Query(min_length=1, description="Address or place search query"),
    count: int = Query(default=5, ge=1, le=10, description="Max results"),
    latitude: float | None = Query(
        default=None, ge=-90.0, le=90.0, description="Reference latitude for proximity"
    ),
    longitude: float | None = Query(
        default=None,
        ge=-180.0,
        le=180.0,
        description="Reference longitude for proximity",
    ),
) -> list[LocationSearchResult]:
    """Search geographic locations and return candidate coordinates.

    Supports street addresses, squares, POIs, districts, and municipalities.
    Optionally applies proximity biasing around reference coordinates.

    Parameters
    ----------
    q : str
        Search query text.
    count : int
        Maximum number of matching candidates to return.
    latitude : float | None
        Optional reference latitude for proximity biasing.
    longitude : float | None
        Optional reference longitude for proximity biasing.

    Returns
    -------
    list[LocationSearchResult]
        Matching places with coordinates and region metadata.
    """
    items = await search_locations(
        q, count=count, latitude=latitude, longitude=longitude
    )
    return [LocationSearchResult.model_validate(item) for item in items]


@router.get("/reverse", response_model=ReverseGeocodeResult)
async def reverse_coordinates(
    latitude: float = Query(ge=-90.0, le=90.0, description="Latitude coordinate"),
    longitude: float = Query(ge=-180.0, le=180.0, description="Longitude coordinate"),
) -> ReverseGeocodeResult:
    """Resolve human-readable place description from latitude and longitude.

    Parameters
    ----------
    latitude : float
        WGS84 latitude.
    longitude : float
        WGS84 longitude.

    Returns
    -------
    ReverseGeocodeResult
        Formatted address and extracted city/locality.
    """
    item = await reverse_geocode(latitude, longitude)
    return ReverseGeocodeResult.model_validate(item)
