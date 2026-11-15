/**
 * Pure domain utility functions for environmental impact and caloric calculation.
 * Aligns client-side preview calculations with the backend business rules in `services/eco_calc.py`.
 */

import { assertNever, TransportMode } from "../types/commute";

/**
 * Baseline emissions and expenditure constants matching backend domain rules.
 * Car emission is 0.17 kg CO2/km, public transit is 0.04 kg CO2/km.
 */
const CAR_BASELINE_CO2_PER_KM = 0.17;
const TRANSIT_CO2_PER_KM = 0.04;
const BIKE_CALORIES_PER_KM = 32.0;
const WALK_CALORIES_PER_KM = 55.0;

/**
 * Result structure of a commute trip's eco calculation preview.
 */
export interface TripEcoMetrics {
  readonly co2SavedKg: number;
  readonly caloriesBurned: number;
}

/**
 * Calculates environmental savings and burned calories for a commute trip.
 *
 * @param distanceKm - Traveled distance in kilometers.
 * @param mode - Selected canonical transport mode.
 * @returns Object containing calculated `co2SavedKg` and `caloriesBurned`.
 */
export function calculateTripEcoMetrics(
  distanceKm: number,
  mode: TransportMode
): TripEcoMetrics {
  if (distanceKm <= 0) {
    return { co2SavedKg: 0, caloriesBurned: 0 };
  }

  switch (mode) {
    case "car":
      return { co2SavedKg: 0, caloriesBurned: 0 };
    case "bike":
      return {
        co2SavedKg: Number((distanceKm * CAR_BASELINE_CO2_PER_KM).toFixed(2)),
        caloriesBurned: Math.round(distanceKm * BIKE_CALORIES_PER_KM),
      };
    case "walk":
      return {
        co2SavedKg: Number((distanceKm * CAR_BASELINE_CO2_PER_KM).toFixed(2)),
        caloriesBurned: Math.round(distanceKm * WALK_CALORIES_PER_KM),
      };
    case "public_transit":
      return {
        co2SavedKg: Number(
          (distanceKm * (CAR_BASELINE_CO2_PER_KM - TRANSIT_CO2_PER_KM)).toFixed(
            2
          )
        ),
        caloriesBurned: 0,
      };
    default:
      return assertNever(mode);
  }
}

/**
 * Formats a canonical transport mode enum value into a localized user-friendly label.
 *
 * @param mode - Canonical transport mode.
 * @returns Human-readable label.
 */
export function formatTransportMode(mode: TransportMode): string {
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
}

/**
 * Returns Tailwind CSS badge color classes customized for each transport mode.
 *
 * @param mode - Canonical transport mode.
 * @returns Tailwind badge styling classes.
 */
export function getTransportModeColor(mode: TransportMode): string {
  switch (mode) {
    case "bike":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "walk":
      return "bg-teal-50 text-teal-700 border-teal-200";
    case "public_transit":
      return "bg-sky-50 text-sky-700 border-sky-200";
    case "car":
      return "bg-amber-50 text-amber-700 border-amber-200";
    default:
      return assertNever(mode);
  }
}
