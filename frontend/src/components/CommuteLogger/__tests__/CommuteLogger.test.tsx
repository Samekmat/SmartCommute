import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { CommuteLogger } from "../CommuteLogger";
import { CommuteLog, Route } from "../../../types/commute";

const mockRoute: Route = {
  id: 1,
  name: "Daily Work Commute",
  origin: "Home",
  destination: "Office",
  distance_km: 10.0,
  latitude: 50.0647,
  longitude: 19.945,
  preferred_transport: "bike",
  created_at: "2026-11-15T12:00:00Z",
};

const mockCreatedLog: CommuteLog = {
  id: 101,
  route_id: 1,
  transport_mode: "bike",
  duration_minutes: 30,
  co2_saved_kg: 1.7,
  calories_burned: 320,
  logged_at: "2026-11-15T14:00:00Z",
};

describe("CommuteLogger Component", () => {
  it("displays live recalculated savings preview based on distance and selected mode", () => {
    render(
      <CommuteLogger
        routes={[mockRoute]}
        selectedRouteId={1}
        onSelectRoute={vi.fn()}
        onLogCommute={vi.fn()}
      />
    );

    // Initial default is bike on 10 km route -> 1.7 kg CO2, 320 kcal
    expect(screen.getByText("1.7 kg")).toBeDefined();
    expect(screen.getByText("320 kcal")).toBeDefined();

    // Switch to walking
    fireEvent.click(screen.getByRole("radio", { name: /Walking/i }));
    // Walking on 10 km route -> 1.7 kg CO2, 550 kcal
    expect(screen.getByText("550 kcal")).toBeDefined();

    // Switch to car -> 0 kg CO2, 0 kcal
    fireEvent.click(screen.getByRole("radio", { name: /Car/i }));
    expect(screen.getByText("0 kg")).toBeDefined();
    expect(screen.getByText("0 kcal")).toBeDefined();
  });

  it("submits commute log and provides visual feedback", async () => {
    const onLogCommute = vi.fn().mockResolvedValue(mockCreatedLog);

    render(
      <CommuteLogger
        routes={[mockRoute]}
        selectedRouteId={1}
        onSelectRoute={vi.fn()}
        onLogCommute={onLogCommute}
      />
    );

    fireEvent.change(screen.getByLabelText(/Duration/i), {
      target: { value: "30" },
    });

    fireEvent.click(screen.getByRole("button", { name: /Log Commute Trip/i }));

    await waitFor(() => {
      expect(onLogCommute).toHaveBeenCalledWith(
        expect.objectContaining({
          route_id: 1,
          transport_mode: "bike",
          duration_minutes: 30,
        })
      );
    });

    // Visual feedback shown
    expect(screen.getByText(/Commute logged successfully!/i)).toBeDefined();
  });
});
