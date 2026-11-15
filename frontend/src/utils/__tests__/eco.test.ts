import { describe, expect, it } from "vitest";
import {
  calculateTripEcoMetrics,
  formatTransportMode,
  getTransportModeColor,
} from "../eco";

describe("Eco Calculation Utilities", () => {
  it("calculates eco metrics for car accurately (baseline: no savings)", () => {
    const metrics = calculateTripEcoMetrics(10.0, "car");
    expect(metrics.co2SavedKg).toBe(0.0);
    expect(metrics.caloriesBurned).toBe(0);
  });

  it("calculates eco metrics for bike (0.17 kg CO2/km, 32 kcal/km)", () => {
    const metrics = calculateTripEcoMetrics(10.0, "bike");
    expect(metrics.co2SavedKg).toBe(1.7);
    expect(metrics.caloriesBurned).toBe(320);
  });

  it("calculates eco metrics for walk (0.17 kg CO2/km, 55 kcal/km)", () => {
    const metrics = calculateTripEcoMetrics(2.0, "walk");
    expect(metrics.co2SavedKg).toBe(0.34);
    expect(metrics.caloriesBurned).toBe(110);
  });

  it("calculates eco metrics for public transit (0.13 kg CO2/km, 0 kcal)", () => {
    const metrics = calculateTripEcoMetrics(10.0, "public_transit");
    expect(metrics.co2SavedKg).toBe(1.3);
    expect(metrics.caloriesBurned).toBe(0);
  });

  it("handles zero or negative distance safely", () => {
    expect(calculateTripEcoMetrics(0, "bike")).toEqual({
      co2SavedKg: 0,
      caloriesBurned: 0,
    });
    expect(calculateTripEcoMetrics(-5, "bike")).toEqual({
      co2SavedKg: 0,
      caloriesBurned: 0,
    });
  });

  it("formats transport mode to human-readable strings with exhaustiveness", () => {
    expect(formatTransportMode("car")).toBe("Car");
    expect(formatTransportMode("bike")).toBe("Bicycle");
    expect(formatTransportMode("public_transit")).toBe("Public Transit");
    expect(formatTransportMode("walk")).toBe("Walking");
  });

  it("provides distinctive color classes for each transport mode", () => {
    expect(getTransportModeColor("bike")).toContain("emerald");
    expect(getTransportModeColor("walk")).toContain("teal");
    expect(getTransportModeColor("public_transit")).toContain("sky");
    expect(getTransportModeColor("car")).toContain("amber");
  });
});
