"""Integration and functional tests for SmartCommute FastAPI REST API."""

import pytest
from app.database import init_db
from app.main import app
from fastapi.testclient import TestClient
from sqlalchemy.pool import StaticPool
from sqlmodel import Session, create_engine


@pytest.fixture
def client_with_clean_db(monkeypatch: pytest.MonkeyPatch):
    """Provide TestClient connected to an isolated in-memory SQLite database."""
    test_engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    init_db(test_engine)

    def get_test_session():
        with Session(test_engine) as session:
            yield session

    from app.database import get_session

    app.dependency_overrides[get_session] = get_test_session
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


def test_cors_headers_configured_for_frontend(client_with_clean_db: TestClient):
    """OPTIONS request with Origin http://localhost:5173 returns allowed CORS headers."""
    response = client_with_clean_db.options(
        "/api/routes",
        headers={
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "GET",
        },
    )
    assert response.status_code == 200
    assert (
        response.headers.get("access-control-allow-origin") == "http://localhost:5173"
    )


def test_health_check_endpoints(client_with_clean_db: TestClient):
    """GET /health and GET /api/health return HTTP 200 with status ok."""
    resp1 = client_with_clean_db.get("/health")
    assert resp1.status_code == 200
    assert resp1.json() == {"status": "ok"}

    resp2 = client_with_clean_db.get("/api/health")
    assert resp2.status_code == 200
    assert resp2.json() == {"status": "ok"}


def test_get_routes_auto_seeds_when_database_is_empty(
    client_with_clean_db: TestClient,
):
    """Initial GET /api/routes auto-seeds 3 predefined routes."""
    response = client_with_clean_db.get("/api/routes")
    assert response.status_code == 200
    routes = response.json()
    assert len(routes) == 3
    assert routes[0]["name"] == "Dom -> Biuro"


def test_create_route_success(client_with_clean_db: TestClient):
    """POST /api/routes creates a valid route with HTTP 201."""
    # Seed routes first
    client_with_clean_db.get("/api/routes")

    payload = {
        "name": "Biuro -> Siłownia",
        "origin": "Zabłocie",
        "destination": "Kazimierz",
        "distance_km": 2.4,
        "latitude": 50.05,
        "longitude": 19.95,
        "preferred_transport": "bike",
    }
    response = client_with_clean_db.post("/api/routes", json=payload)
    assert response.status_code == 201
    created = response.json()
    assert created["id"] is not None
    assert created["name"] == "Biuro -> Siłownia"
    assert created["distance_km"] == 2.4


def test_get_commutes_returns_empty_when_database_is_fresh(
    client_with_clean_db: TestClient,
):
    """GET /api/commutes returns zeroed totals and empty list on fresh database."""
    response = client_with_clean_db.get("/api/commutes")
    assert response.status_code == 200
    data = response.json()
    assert data["logs"] == []
    assert data["trips_count"] == 0
    assert data["total_co2_saved_kg"] == 0.0
    assert data["total_calories"] == 0


def test_create_route_validation_error(client_with_clean_db: TestClient):
    """POST /api/routes with non-positive distance returns HTTP 422."""
    payload = {
        "name": "Błędna trasa",
        "origin": "A",
        "destination": "B",
        "distance_km": -1.0,
        "preferred_transport": "bike",
    }
    response = client_with_clean_db.post("/api/routes", json=payload)
    assert response.status_code == 422


@pytest.mark.parametrize(
    "invalid_payload",
    [
        {
            "name": "",
            "origin": "A",
            "destination": "B",
            "distance_km": 5.0,
            "preferred_transport": "bike",
        },
        {
            "name": "Trasa",
            "origin": "",
            "destination": "B",
            "distance_km": 5.0,
            "preferred_transport": "bike",
        },
        {
            "name": "Trasa",
            "origin": "A",
            "destination": "",
            "distance_km": 5.0,
            "preferred_transport": "bike",
        },
        {
            "name": "Trasa",
            "origin": "A",
            "destination": "B",
            "distance_km": 0.0,
            "preferred_transport": "bike",
        },
        {
            "name": "Trasa",
            "origin": "A",
            "destination": "B",
            "distance_km": 5.0,
            "preferred_transport": "hoverboard",
        },
    ],
)
def test_create_route_validation_errors_matrix(
    client_with_clean_db: TestClient, invalid_payload: dict
):
    """POST /api/routes rejects invalid payload combinations with HTTP 422."""
    response = client_with_clean_db.post("/api/routes", json=invalid_payload)
    assert response.status_code == 422


@pytest.mark.parametrize(
    "invalid_update",
    [
        {"name": ""},
        {"origin": ""},
        {"destination": ""},
        {"distance_km": 0.0},
        {"distance_km": -4.2},
        {"preferred_transport": "teleportation"},
    ],
)
def test_update_route_validation_errors(
    client_with_clean_db: TestClient, invalid_update: dict
):
    """PUT /api/routes/{id} rejects invalid updates with HTTP 422."""
    routes = client_with_clean_db.get("/api/routes").json()
    route_id = routes[0]["id"]

    response = client_with_clean_db.put(f"/api/routes/{route_id}", json=invalid_update)
    assert response.status_code == 422


def test_update_route_success_and_not_found(client_with_clean_db: TestClient):
    """PUT /api/routes/{id} updates route or returns 404 if missing."""
    # Seed database
    routes = client_with_clean_db.get("/api/routes").json()
    route_id = routes[0]["id"]

    update_payload = {"name": "Nowa nazwa trasy", "distance_km": 7.5}
    response = client_with_clean_db.put(f"/api/routes/{route_id}", json=update_payload)
    assert response.status_code == 200
    updated = response.json()
    assert updated["name"] == "Nowa nazwa trasy"
    assert updated["distance_km"] == 7.5

    # 404 for non-existent route
    response_404 = client_with_clean_db.put("/api/routes/99999", json=update_payload)
    assert response_404.status_code == 404


def test_delete_route_cascades_logs(client_with_clean_db: TestClient):
    """DELETE /api/routes/{id} removes the route and cascades its commute logs with HTTP 204."""
    routes = client_with_clean_db.get("/api/routes").json()
    route_id = routes[0]["id"]

    initial_commutes = client_with_clean_db.get("/api/commutes").json()
    initial_route_logs = [
        log for log in initial_commutes["logs"] if log["route_id"] == route_id
    ]
    assert len(initial_route_logs) > 0

    response = client_with_clean_db.delete(f"/api/routes/{route_id}")
    assert response.status_code == 204

    get_res = client_with_clean_db.get("/api/routes")
    remaining_ids = [r["id"] for r in get_res.json()]
    assert route_id not in remaining_ids

    updated_commutes = client_with_clean_db.get("/api/commutes").json()
    cascaded_logs = [
        log for log in updated_commutes["logs"] if log["route_id"] == route_id
    ]
    assert cascaded_logs == []

    delete_missing_res = client_with_clean_db.delete("/api/routes/99999")
    assert delete_missing_res.status_code == 404


def test_get_commutes_returns_logs_and_summary_stats(
    client_with_clean_db: TestClient,
):
    """GET /api/commutes returns trip history and aggregated eco metrics."""
    # Seed routes and default 4 commute logs
    client_with_clean_db.get("/api/routes")

    response = client_with_clean_db.get("/api/commutes")
    assert response.status_code == 200
    data = response.json()

    assert "logs" in data
    assert len(data["logs"]) == 4
    assert data["trips_count"] == 4
    assert data["total_co2_saved_kg"] > 0
    assert data["total_calories"] > 0


def test_post_commute_auto_calculates_eco_metrics(client_with_clean_db: TestClient):
    """POST /api/commutes computes co2_saved_kg and calories_burned if omitted."""
    routes = client_with_clean_db.get("/api/routes").json()
    route = routes[0]  # Dom -> Biuro, 5.5 km

    payload = {
        "route_id": route["id"],
        "transport_mode": "bike",
        "duration_minutes": 25,
    }
    response = client_with_clean_db.post("/api/commutes", json=payload)
    assert response.status_code == 201
    created_log = response.json()

    assert created_log["route_id"] == route["id"]
    # 0.17 * 5.5 = 0.94 kg CO2, 32 * 5.5 = 176 kcal
    assert created_log["co2_saved_kg"] == round(0.17 * 5.5, 2)
    assert created_log["calories_burned"] == round(32 * 5.5)


def test_post_commute_for_nonexistent_route_returns_404(
    client_with_clean_db: TestClient,
):
    """POST /api/commutes for missing route_id returns HTTP 404."""
    payload = {
        "route_id": 99999,
        "transport_mode": "walk",
        "duration_minutes": 15,
    }
    response = client_with_clean_db.post("/api/commutes", json=payload)
    assert response.status_code == 404


@pytest.mark.parametrize(
    "invalid_commute",
    [
        {"route_id": 1, "transport_mode": "walk", "duration_minutes": 0},
        {"route_id": 1, "transport_mode": "walk", "duration_minutes": -15},
        {"route_id": 1, "transport_mode": "flying_carpet", "duration_minutes": 20},
        {"transport_mode": "bike", "duration_minutes": 20},  # missing route_id
    ],
)
def test_post_commute_validation_errors_matrix(
    client_with_clean_db: TestClient, invalid_commute: dict
):
    """POST /api/commutes rejects invalid commute payloads with HTTP 422."""
    client_with_clean_db.get("/api/routes")  # seed routes
    response = client_with_clean_db.post("/api/commutes", json=invalid_commute)
    assert response.status_code == 422


def test_ai_recommend_endpoint_with_simulator_override(
    client_with_clean_db: TestClient,
):
    """POST /api/routes/{id}/ai-recommend returns structured recommendation."""
    routes = client_with_clean_db.get("/api/routes").json()
    route_id = routes[0]["id"]

    # Test with weather simulator override 'rain'
    payload = {"weather_override": "rain"}
    response = client_with_clean_db.post(
        f"/api/routes/{route_id}/ai-recommend", json=payload
    )
    assert response.status_code == 200
    recommendation = response.json()

    assert recommendation["recommended_mode"] in ("public_transit", "car")
    assert "weather_summary" in recommendation
    assert "reasoning" in recommendation
    assert recommendation["estimated_duration_min"] > 0
    assert recommendation["ai_source"] in ("llm", "heuristic_fallback")


def test_ai_recommend_for_nonexistent_route_returns_404(
    client_with_clean_db: TestClient,
):
    """POST /api/routes/99999/ai-recommend returns HTTP 404."""
    response = client_with_clean_db.post(
        "/api/routes/99999/ai-recommend", json={"weather_override": "sunny"}
    )
    assert response.status_code == 404


def test_ai_recommend_invalid_weather_override_returns_422(
    client_with_clean_db: TestClient,
):
    """POST /api/routes/{id}/ai-recommend with invalid weather override returns HTTP 422."""
    routes = client_with_clean_db.get("/api/routes").json()
    route_id = routes[0]["id"]

    response = client_with_clean_db.post(
        f"/api/routes/{route_id}/ai-recommend", json={"weather_override": "cyclone"}
    )
    assert response.status_code == 422


def test_ai_status_endpoint_returns_boolean_flags(client_with_clean_db: TestClient):
    """GET /api/ai/status returns provider presence indicators without exposing keys."""
    response = client_with_clean_db.get("/api/ai/status")
    assert response.status_code == 200
    data = response.json()
    assert "gemini_configured" in data
    assert "openai_configured" in data
    assert "claude_configured" in data
    assert "active_default" in data
    assert isinstance(data["gemini_configured"], bool)


def test_ai_config_endpoint_registers_key_in_session(
    client_with_clean_db: TestClient, monkeypatch: pytest.MonkeyPatch
):
    """POST /api/ai/config registers provider key."""
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)
    payload = {
        "provider": "gemini",
        "api_key": "AIzaSyTestKey123",
        "save_to_env": False,
    }
    response = client_with_clean_db.post("/api/ai/config", json=payload)
    assert response.status_code == 200
    res_data = response.json()
    assert res_data["provider"] == "gemini"
    assert res_data["saved_to_env"] is False

    # Status should now indicate gemini is configured
    status_res = client_with_clean_db.get("/api/ai/status")
    assert status_res.json()["gemini_configured"] is True
