import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiClientError, ApiValidationError, createApiClient } from "../client";
import {
  RouteCreate,
  RouteUpdate,
  CommuteLogCreate,
} from "../../types/commute";

describe("ApiClient", () => {
  const originalFetch = globalThis.fetch;
  let client: ReturnType<typeof createApiClient>;

  beforeEach(() => {
    client = createApiClient("http://localhost:8000");
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  describe("getRoutes", () => {
    it("fetches and validates routes array", async () => {
      const mockRoutes = [
        {
          id: 1,
          name: "Dom -> Praca",
          origin: "Krowodrza",
          destination: "Zabłocie",
          distance_km: 6.5,
          latitude: 50.0647,
          longitude: 19.945,
          preferred_transport: "bike",
          created_at: "2026-11-15T10:00:00Z",
        },
      ];

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => mockRoutes,
      });

      const routes = await client.getRoutes();
      expect(routes).toEqual(mockRoutes);
      expect(globalThis.fetch).toHaveBeenCalledWith(
        "http://localhost:8000/api/routes",
        expect.objectContaining({ method: "GET" })
      );
    });

    it("throws ApiValidationError when response does not match Route schema", async () => {
      const invalidData = [
        {
          id: "not_a_number",
          name: "Invalid",
        },
      ];

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => invalidData,
      });

      await expect(client.getRoutes()).rejects.toThrow(ApiValidationError);
    });
  });

  describe("createRoute", () => {
    it("posts new route and returns parsed Route", async () => {
      const payload: RouteCreate = {
        name: "Mieszkanie -> Siłownia",
        origin: "Rondo Grzegórzeckie",
        destination: "Kazimierz",
        distance_km: 3.2,
        latitude: 50.0647,
        longitude: 19.945,
        preferred_transport: "bike",
      };

      const mockCreated = {
        id: 2,
        ...payload,
        created_at: "2026-11-15T12:00:00Z",
      };

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 201,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => mockCreated,
      });

      const result = await client.createRoute(payload);
      expect(result.id).toBe(2);
      expect(result.name).toBe("Mieszkanie -> Siłownia");
      expect(globalThis.fetch).toHaveBeenCalledWith(
        "http://localhost:8000/api/routes",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify(payload),
        })
      );
    });
  });

  describe("updateRoute", () => {
    it("sends PUT request and returns updated Route", async () => {
      const updatePayload: RouteUpdate = {
        distance_km: 7.0,
      };

      const mockUpdated = {
        id: 1,
        name: "Dom -> Praca",
        origin: "Krowodrza",
        destination: "Zabłocie",
        distance_km: 7.0,
        latitude: 50.0647,
        longitude: 19.945,
        preferred_transport: "bike",
        created_at: "2026-11-15T10:00:00Z",
      };

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => mockUpdated,
      });

      const result = await client.updateRoute(1, updatePayload);
      expect(result.distance_km).toBe(7.0);
      expect(globalThis.fetch).toHaveBeenCalledWith(
        "http://localhost:8000/api/routes/1",
        expect.objectContaining({
          method: "PUT",
          body: JSON.stringify(updatePayload),
        })
      );
    });
  });

  describe("deleteRoute", () => {
    it("sends DELETE request and completes successfully", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 204,
        headers: new Headers(),
        text: async () => "",
      });

      await expect(client.deleteRoute(1)).resolves.toBeUndefined();
      expect(globalThis.fetch).toHaveBeenCalledWith(
        "http://localhost:8000/api/routes/1",
        expect.objectContaining({ method: "DELETE" })
      );
    });
  });

  describe("getCommuteHistory", () => {
    it("fetches aggregated commute history", async () => {
      const mockHistory = {
        logs: [
          {
            id: 1,
            route_id: 1,
            transport_mode: "bike",
            duration_minutes: 20,
            co2_saved_kg: 1.1,
            calories_burned: 200,
            logged_at: "2026-11-15T11:00:00Z",
          },
        ],
        total_co2_saved_kg: 1.1,
        total_calories: 200,
        trips_count: 1,
      };

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => mockHistory,
      });

      const history = await client.getCommuteHistory();
      expect(history.trips_count).toBe(1);
      expect(history.total_co2_saved_kg).toBe(1.1);
    });
  });

  describe("logCommute", () => {
    it("posts commute entry and returns saved log with eco metrics", async () => {
      const payload: CommuteLogCreate = {
        route_id: 1,
        transport_mode: "walk",
        duration_minutes: 35,
      };

      const mockCreated = {
        id: 5,
        route_id: 1,
        transport_mode: "walk",
        duration_minutes: 35,
        co2_saved_kg: 0.45,
        calories_burned: 140,
        logged_at: "2026-11-15T14:30:00Z",
      };

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 201,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => mockCreated,
      });

      const result = await client.logCommute(payload);
      expect(result.id).toBe(5);
      expect(result.co2_saved_kg).toBe(0.45);
    });
  });

  describe("getAIRecommendation", () => {
    it("requests recommendation and returns validated AI response", async () => {
      const mockRec = {
        recommended_mode: "bike",
        weather_summary: "15°C, słonecznie, wiatr 10 km/h",
        reasoning: "Dobra pogoda sprzyja podróży rowerem.",
        estimated_duration_min: 22,
        potential_co2_saved_kg: 1.1,
        calories_estimate: 208,
        ai_source: "heuristic_fallback",
      };

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => mockRec,
      });

      const result = await client.getAIRecommendation(1, {
        weather_override: "sunny",
      });
      expect(result.recommended_mode).toBe("bike");
      expect(result.ai_source).toBe("heuristic_fallback");
      expect(globalThis.fetch).toHaveBeenCalledWith(
        "http://localhost:8000/api/routes/1/ai-recommend",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ weather_override: "sunny" }),
        })
      );
    });
  });

  describe("AI Configuration API", () => {
    it("fetches and validates AI provider status", async () => {
      const mockStatus = {
        gemini_configured: true,
        openai_configured: false,
        claude_configured: false,
        active_default: "gemini",
      };

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => mockStatus,
      });

      const res = await client.getAIStatus();
      expect(res.gemini_configured).toBe(true);
      expect(res.active_default).toBe("gemini");
    });

    it("saves AI configuration key and validates response", async () => {
      const mockResponse = {
        provider: "gemini",
        saved_to_env: true,
        message: "Key saved successfully",
      };

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => mockResponse,
      });

      const res = await client.saveAIConfig({
        provider: "gemini",
        api_key: "AIzaSyMockKey",
        save_to_env: true,
      });
      expect(res.provider).toBe("gemini");
      expect(res.saved_to_env).toBe(true);
    });
  });

  describe("Geocoding API", () => {
    it("searches locations and returns validated candidates", async () => {
      const mockLocations = [
        {
          name: "Kraków",
          latitude: 50.0614,
          longitude: 19.9366,
          country: "Polska",
          admin1: "Województwo małopolskie",
          display_name: "Kraków, Województwo małopolskie, Polska",
        },
      ];

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => mockLocations,
      });

      const res = await client.searchLocations("Krakow");
      expect(res).toEqual(mockLocations);
      expect(globalThis.fetch).toHaveBeenCalledWith(
        "http://localhost:8000/api/geocoding/search?q=Krakow&count=5",
        expect.objectContaining({ method: "GET" })
      );
    });

    it("reverse geocodes coordinates to address", async () => {
      const mockReverse = {
        display_name: "Rynek Główny, Kraków, Polska",
        city: "Kraków",
        latitude: 50.0614,
        longitude: 19.9366,
      };

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => mockReverse,
      });

      const res = await client.reverseGeocode(50.0614, 19.9366);
      expect(res).toEqual(mockReverse);
      expect(globalThis.fetch).toHaveBeenCalledWith(
        "http://localhost:8000/api/geocoding/reverse?latitude=50.0614&longitude=19.9366",
        expect.objectContaining({ method: "GET" })
      );
    });
  });

  describe("HTTP & Network Error Handling", () => {
    it("throws ApiClientError with backend message on HTTP 404", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({ detail: "Route with id 999 not found" }),
      });

      await expect(client.deleteRoute(999)).rejects.toThrow(
        "Route with id 999 not found"
      );
    });

    it("throws ApiClientError when network fetch fails", async () => {
      globalThis.fetch = vi
        .fn()
        .mockRejectedValue(new Error("Connection refused"));

      await expect(client.getRoutes()).rejects.toThrow(ApiClientError);
    });
  });
});
