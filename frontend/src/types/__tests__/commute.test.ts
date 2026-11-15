import { describe, expect, it } from "vitest";
import {
  AIRecommendationResponseSchema,
  assertNever,
  AsyncState,
  CommuteHistoryResponseSchema,
  CommuteLogCreateSchema,
  CommuteLogSchema,
  RouteCreateSchema,
  RouteSchema,
  RouteUpdateSchema,
  TransportMode,
  WeatherOverrideSchema,
} from "../commute";

describe("TransportMode and Exhaustiveness", () => {
  it("exhaustively narrows all transport modes without fallback", () => {
    const modes: TransportMode[] = ["car", "bike", "public_transit", "walk"];

    const labels = modes.map((mode) => {
      switch (mode) {
        case "car":
          return "Car";
        case "bike":
          return "Bicycle";
        case "public_transit":
          return "Public Transit";
        case "walk":
          return "Walking";
        default:
          return assertNever(mode);
      }
    });

    expect(labels).toEqual(["Car", "Bicycle", "Public Transit", "Walking"]);
  });

  it("throws runtime error when assertNever is reached", () => {
    expect(() => {
      // Cast invalid string safely for runtime test
      assertNever("unknown_mode" as never);
    }).toThrow('Unhandled discriminated union variant: "unknown_mode"');
  });
});

describe("Route Schemas Validation", () => {
  it("validates a complete RouteRead object", () => {
    const validRawRoute: unknown = {
      id: 1,
      name: "Dom -> Biuro",
      origin: "Krowodrza",
      destination: "Zabłocie",
      distance_km: 7.2,
      latitude: 50.0647,
      longitude: 19.945,
      preferred_transport: "bike",
      created_at: "2026-11-15T12:00:00Z",
    };

    const parsed = RouteSchema.parse(validRawRoute);
    expect(parsed.id).toBe(1);
    expect(parsed.preferred_transport).toBe("bike");
    expect(parsed.distance_km).toBe(7.2);
  });

  it("rejects invalid route with negative distance or empty name", () => {
    const invalidRawRoute: unknown = {
      id: 2,
      name: "",
      origin: "Krowodrza",
      destination: "Zabłocie",
      distance_km: -3.5,
      latitude: 50.0647,
      longitude: 19.945,
      preferred_transport: "rocket_ship",
      created_at: "2026-11-15T12:00:00Z",
    };

    expect(() => RouteSchema.parse(invalidRawRoute)).toThrow();
  });

  it("validates RouteCreate with default coordinates", () => {
    const rawCreate: unknown = {
      name: "Nowa Trasa",
      origin: "Kazimierz",
      destination: "Podgórze",
      distance_km: 2.1,
      preferred_transport: "walk",
    };

    const parsed = RouteCreateSchema.parse(rawCreate);
    expect(parsed.latitude).toBe(50.0647);
    expect(parsed.longitude).toBe(19.945);
  });

  it("validates RouteUpdate with partial or nullable values", () => {
    const rawUpdate: unknown = {
      name: "Zaktualizowana Trasa",
      latitude: null,
      distance_km: 5.5,
    };

    const parsed = RouteUpdateSchema.parse(rawUpdate);
    expect(parsed.name).toBe("Zaktualizowana Trasa");
    expect(parsed.latitude).toBeNull();
    expect(parsed.distance_km).toBe(5.5);
    expect(parsed.origin).toBeUndefined();
  });
});

describe("Commute Log Schemas Validation", () => {
  it("validates a CommuteLogRead response", () => {
    const validLog: unknown = {
      id: 10,
      route_id: 1,
      transport_mode: "bike",
      duration_minutes: 25,
      co2_saved_kg: 1.22,
      calories_burned: 230,
      logged_at: "2026-11-15T14:00:00Z",
    };

    const parsed = CommuteLogSchema.parse(validLog);
    expect(parsed.id).toBe(10);
    expect(parsed.calories_burned).toBe(230);
  });

  it("validates CommuteHistoryResponse aggregate", () => {
    const validHistory: unknown = {
      logs: [
        {
          id: 1,
          route_id: 1,
          transport_mode: "walk",
          duration_minutes: 30,
          co2_saved_kg: 0.35,
          calories_burned: 110,
          logged_at: "2026-11-15T10:00:00Z",
        },
      ],
      total_co2_saved_kg: 0.35,
      total_calories: 110,
      trips_count: 1,
    };

    const parsed = CommuteHistoryResponseSchema.parse(validHistory);
    expect(parsed.trips_count).toBe(1);
    expect(parsed.logs).toHaveLength(1);
  });

  it("validates CommuteLogCreate payload", () => {
    const payload: unknown = {
      route_id: 2,
      transport_mode: "public_transit",
      duration_minutes: 40,
    };

    const parsed = CommuteLogCreateSchema.parse(payload);
    expect(parsed.duration_minutes).toBe(40);
  });
});

describe("AI Recommendation Schemas", () => {
  it("validates AIRecommendationResponse for heuristic fallback", () => {
    const validResponse: unknown = {
      recommended_mode: "bike",
      weather_summary: "16°C, umiarkowane zachmurzenie, wiatr 14 km/h",
      reasoning: "Umiarkowany dystans i brak opadów sprzyjają rowerowi.",
      estimated_duration_min: 24,
      potential_co2_saved_kg: 1.22,
      calories_estimate: 230,
      ai_source: "heuristic_fallback",
    };

    const parsed = AIRecommendationResponseSchema.parse(validResponse);
    expect(parsed.ai_source).toBe("heuristic_fallback");
    expect(parsed.recommended_mode).toBe("bike");
  });

  it("validates AIRecommendationResponse for LLM source", () => {
    const validResponse: unknown = {
      recommended_mode: "public_transit",
      weather_summary: "5°C, ulewa, wiatr 30 km/h",
      reasoning: "Ze względu na deszcz i chłód zalecana komunikacja miejska.",
      estimated_duration_min: 35,
      potential_co2_saved_kg: 0.93,
      calories_estimate: 0,
      ai_source: "llm",
    };

    const parsed = AIRecommendationResponseSchema.parse(validResponse);
    expect(parsed.ai_source).toBe("llm");
  });

  it("validates weather overrides", () => {
    expect(WeatherOverrideSchema.parse("rain")).toBe("rain");
    expect(WeatherOverrideSchema.parse("sunny")).toBe("sunny");
    expect(WeatherOverrideSchema.parse("windy")).toBe("windy");
    expect(WeatherOverrideSchema.parse("cold")).toBe("cold");
    expect(() => WeatherOverrideSchema.parse("snow")).toThrow();
  });
});

describe("AsyncState Discriminated Union", () => {
  it("correctly models all asynchronous UI states", () => {
    const idle: AsyncState<string> = { status: "idle" };
    const loading: AsyncState<string> = { status: "loading" };
    const success: AsyncState<string> = { status: "success", data: "hello" };
    const error: AsyncState<string> = { status: "error", message: "failed" };

    const renderState = (state: AsyncState<string>): string => {
      switch (state.status) {
        case "idle":
          return "Ready";
        case "loading":
          return "Loading...";
        case "success":
          return `Data: ${state.data}`;
        case "error":
          return `Error: ${state.message}`;
        default:
          return assertNever(state);
      }
    };

    expect(renderState(idle)).toBe("Ready");
    expect(renderState(loading)).toBe("Loading...");
    expect(renderState(success)).toBe("Data: hello");
    expect(renderState(error)).toBe("Error: failed");
  });
});
