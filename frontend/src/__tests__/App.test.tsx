import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import App from "../App";
import { createApiClient } from "../api/client";
import { CommuteHistoryResponse, Route } from "../types/commute";

const mockRoutes: Route[] = [
  {
    id: 1,
    name: "Kraków Rynek to Zabłocie",
    origin: "Kraków Rynek",
    destination: "Zabłocie Tech Park",
    distance_km: 4.5,
    latitude: 50.0647,
    longitude: 19.945,
    preferred_transport: "bike",
    created_at: "2026-11-15T10:00:00Z",
  },
];

const mockHistory: CommuteHistoryResponse = {
  total_co2_saved_kg: 3.4,
  total_calories: 640,
  trips_count: 2,
  logs: [
    {
      id: 10,
      route_id: 1,
      transport_mode: "bike",
      duration_minutes: 18,
      co2_saved_kg: 1.7,
      calories_burned: 320,
      logged_at: "2026-11-15T11:00:00Z",
    },
  ],
};

describe("App Root Component", () => {
  it("loads routes and commute history on initial mount and displays dashboard", async () => {
    const mockClient = createApiClient();
    vi.spyOn(mockClient, "getRoutes").mockResolvedValue(mockRoutes);
    vi.spyOn(mockClient, "getCommuteHistory").mockResolvedValue(mockHistory);

    render(<App apiClient={mockClient} />);

    // Shows loading initially or transitions to content
    await waitFor(() => {
      expect(
        screen.getAllByText("Kraków Rynek to Zabłocie").length
      ).toBeGreaterThanOrEqual(1);
    });

    expect(screen.getByText("3.4 kg")).toBeDefined();
    expect(screen.getByText("SmartCommute")).toBeDefined();
    expect(screen.getByText(/AI Travel Advisor/i)).toBeDefined();
    expect(screen.getByText(/Log Your Commute/i)).toBeDefined();
  });
});
