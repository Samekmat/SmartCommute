import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { EcoDashboard } from "../EcoDashboard";
import { CommuteHistoryResponse, Route } from "../../../types/commute";

const mockRoutes: readonly Route[] = [
  {
    id: 1,
    name: "Home to Tech Hub",
    origin: "Home",
    destination: "Tech Hub",
    distance_km: 10.0,
    latitude: 50.0647,
    longitude: 19.945,
    preferred_transport: "bike",
    created_at: "2026-11-15T12:00:00Z",
  },
];

const mockHistory: CommuteHistoryResponse = {
  total_co2_saved_kg: 8.5,
  total_calories: 1600,
  trips_count: 5,
  logs: [
    {
      id: 1,
      route_id: 1,
      transport_mode: "bike",
      duration_minutes: 25,
      co2_saved_kg: 1.7,
      calories_burned: 320,
      logged_at: "2026-11-15T14:30:00Z",
    },
  ],
};

describe("EcoDashboard Component", () => {
  it("renders aggregate statistics for CO2 saved, calories burned, and trip count", () => {
    render(<EcoDashboard history={mockHistory} routes={mockRoutes} />);

    expect(screen.getByText("8.5 kg")).toBeDefined();
    expect(screen.getByText("1,600 kcal")).toBeDefined();
    expect(screen.getByText("5")).toBeDefined();
  });

  it("renders history log list items with route name, mode badge and metrics", () => {
    render(<EcoDashboard history={mockHistory} routes={mockRoutes} />);

    expect(screen.getByText("Home to Tech Hub")).toBeDefined();
    expect(screen.getByText("25 min")).toBeDefined();
    expect(screen.getByText("+1.7 kg CO2")).toBeDefined();
    expect(screen.getByText("+320 kcal")).toBeDefined();
    expect(screen.getByText("Bicycle")).toBeDefined();
  });

  it("renders empty state message when no history logs exist", () => {
    const emptyHistory: CommuteHistoryResponse = {
      total_co2_saved_kg: 0,
      total_calories: 0,
      trips_count: 0,
      logs: [],
    };

    render(<EcoDashboard history={emptyHistory} routes={mockRoutes} />);

    expect(screen.getByText(/No commute trips logged yet/i)).toBeDefined();
  });
});
