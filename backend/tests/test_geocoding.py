"""Unit and integration tests for geocoding and reverse geocoding."""

import httpx
import pytest
from app.main import app
from app.services.geocoding import (
    LocationItem,
    ReverseGeocodeItem,
    reverse_geocode,
    search_locations,
)
from fastapi.testclient import TestClient


@pytest.mark.asyncio
async def test_search_locations_success(monkeypatch: pytest.MonkeyPatch):
    """search_locations parses Open-Meteo geocoding response into LocationItems."""
    mock_response = {
        "results": [
            {
                "id": 1,
                "name": "Kraków",
                "latitude": 50.0614,
                "longitude": 19.9366,
                "country": "Polska",
                "admin1": "Województwo małopolskie",
            }
        ]
    }

    async def mock_handler(request: httpx.Request) -> httpx.Response:
        assert "geocoding-api.open-meteo.com" in str(request.url)
        return httpx.Response(200, json=mock_response)

    real_async_client = httpx.AsyncClient

    def mocked_async_client(*args, **kwargs):
        kwargs["transport"] = httpx.MockTransport(mock_handler)
        return real_async_client(*args, **kwargs)

    monkeypatch.setattr(httpx, "AsyncClient", mocked_async_client)

    results = await search_locations("Krakow")
    assert len(results) == 1
    assert isinstance(results[0], LocationItem)
    assert results[0].name == "Kraków"
    assert results[0].latitude == 50.0614
    assert results[0].longitude == 19.9366
    assert "Kraków" in results[0].display_name
    assert "Polska" in results[0].display_name


@pytest.mark.asyncio
async def test_search_locations_empty_query():
    """search_locations returns empty list when given empty query."""
    res = await search_locations("   ")
    assert res == []


@pytest.mark.asyncio
async def test_search_locations_error_fallback(monkeypatch: pytest.MonkeyPatch):
    """search_locations returns empty list gracefully on HTTP network failure."""

    async def mock_failing_handler(request: httpx.Request) -> httpx.Response:
        raise httpx.ConnectError("Network unreachable")

    real_async_client = httpx.AsyncClient

    def mocked_async_client(*args, **kwargs):
        kwargs["transport"] = httpx.MockTransport(mock_failing_handler)
        return real_async_client(*args, **kwargs)

    monkeypatch.setattr(httpx, "AsyncClient", mocked_async_client)

    results = await search_locations("Warszawa")
    assert results == []


@pytest.mark.asyncio
async def test_reverse_geocode_success(monkeypatch: pytest.MonkeyPatch):
    """reverse_geocode parses Nominatim response into ReverseGeocodeItem."""
    mock_response = {
        "display_name": "Rynek Główny, Stare Miasto, Kraków, Polska",
        "address": {"city": "Kraków", "country": "Polska"},
    }

    async def mock_handler(request: httpx.Request) -> httpx.Response:
        assert "nominatim.openstreetmap.org" in str(request.url)
        return httpx.Response(200, json=mock_response)

    real_async_client = httpx.AsyncClient

    def mocked_async_client(*args, **kwargs):
        kwargs["transport"] = httpx.MockTransport(mock_handler)
        return real_async_client(*args, **kwargs)

    monkeypatch.setattr(httpx, "AsyncClient", mocked_async_client)

    res = await reverse_geocode(50.0614, 19.9366)
    assert isinstance(res, ReverseGeocodeItem)
    assert res.city == "Kraków"
    assert "Rynek Główny" in res.display_name


def test_api_geocoding_endpoints(monkeypatch: pytest.MonkeyPatch):
    """Integration test for /api/geocoding/search and /api/geocoding/reverse."""

    async def mock_search_handler(request: httpx.Request) -> httpx.Response:
        if "geocoding-api.open-meteo.com" in str(request.url):
            return httpx.Response(
                200,
                json={
                    "results": [
                        {
                            "name": "Wrocław",
                            "latitude": 51.1079,
                            "longitude": 17.0385,
                            "country": "Polska",
                            "admin1": "Dolnośląskie",
                        }
                    ]
                },
            )
        return httpx.Response(
            200,
            json={
                "display_name": "Rynek, Wrocław, Polska",
                "address": {"city": "Wrocław"},
            },
        )

    real_async_client = httpx.AsyncClient

    def mocked_async_client(*args, **kwargs):
        kwargs["transport"] = httpx.MockTransport(mock_search_handler)
        return real_async_client(*args, **kwargs)

    monkeypatch.setattr(httpx, "AsyncClient", mocked_async_client)

    with TestClient(app) as client:
        # Search endpoint
        search_res = client.get("/api/geocoding/search?q=Wroclaw")
        assert search_res.status_code == 200
        items = search_res.json()
        assert len(items) == 1
        assert items[0]["name"] == "Wrocław"
        assert items[0]["latitude"] == 51.1079

        # Reverse endpoint
        rev_res = client.get(
            "/api/geocoding/reverse?latitude=51.1079&longitude=17.0385"
        )
        assert rev_res.status_code == 200
        rev_data = rev_res.json()
        assert rev_data["city"] == "Wrocław"
        assert "Rynek" in rev_data["display_name"]
