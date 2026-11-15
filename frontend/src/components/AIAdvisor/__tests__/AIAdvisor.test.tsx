import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AIAdvisor } from "../AIAdvisor";
import { AIRecommendationResponse, Route } from "../../../types/commute";

const mockRoute: Route = {
  id: 1,
  name: "Office Commute",
  origin: "Nowy Świat",
  destination: "Mokotów",
  distance_km: 7.2,
  latitude: 52.2297,
  longitude: 21.0122,
  preferred_transport: "bike",
  created_at: "2026-11-15T12:00:00Z",
};

const mockLlmRec: AIRecommendationResponse = {
  recommended_mode: "bike",
  weather_summary: "19°C, sunny with light breeze",
  reasoning:
    "Sunny weather with comfortable temperature makes cycling optimal for a 7.2 km route.",
  estimated_duration_min: 22,
  potential_co2_saved_kg: 1.22,
  calories_estimate: 230,
  ai_source: "llm",
};

const mockFallbackRec: AIRecommendationResponse = {
  recommended_mode: "public_transit",
  weather_summary: "10°C, moderate rain",
  reasoning:
    "Rainy conditions make public transit safer and more comfortable than cycling.",
  estimated_duration_min: 28,
  potential_co2_saved_kg: 0.94,
  calories_estimate: 0,
  ai_source: "heuristic_fallback",
};

describe("AIAdvisor Component", () => {
  it("allows selecting a weather condition from the simulator and requesting recommendation", async () => {
    const onRequestRecommendation = vi.fn().mockResolvedValue(mockFallbackRec);

    render(
      <AIAdvisor
        selectedRoute={mockRoute}
        onRequestRecommendation={onRequestRecommendation}
        onApplyToLogger={vi.fn()}
      />
    );

    // Weather simulator select exists
    const weatherSelect = screen.getByLabelText(/Weather Condition/i);
    fireEvent.change(weatherSelect, { target: { value: "rain" } });

    // Click Get Recommendation
    fireEvent.click(
      screen.getByRole("button", { name: /Get AI Recommendation/i })
    );

    await waitFor(() => {
      expect(onRequestRecommendation).toHaveBeenCalledWith(1, {
        weather_override: "rain",
      });
    });

    // Displays recommendation details and zero-config fallback badge
    expect(screen.getByText("Zero-Config Fallback")).toBeDefined();
    expect(screen.getByText("10°C, moderate rain")).toBeDefined();
    expect(
      screen.getByText(/Rainy conditions make public transit safer/i)
    ).toBeDefined();
    expect(screen.getByText("28 min")).toBeDefined();
  });

  it("triggers onApplyToLogger when clicking the apply button", async () => {
    const onApply = vi.fn();
    const onRequest = vi.fn().mockResolvedValue(mockLlmRec);

    render(
      <AIAdvisor
        selectedRoute={mockRoute}
        onRequestRecommendation={onRequest}
        onApplyToLogger={onApply}
      />
    );

    fireEvent.click(
      screen.getByRole("button", { name: /Get AI Recommendation/i })
    );

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /Apply to Commute Logger/i })
      ).toBeDefined();
    });

    fireEvent.click(
      screen.getByRole("button", { name: /Apply to Commute Logger/i })
    );
    expect(onApply).toHaveBeenCalledWith({
      mode: "bike",
      durationMinutes: 22,
    });
  });
});
