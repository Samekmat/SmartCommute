/**
 * Geographic calculation utilities for coordinates and distance estimation.
 * Employs strict type safety and pure domain functions.
 */

/**
 * WGS84 geographic coordinates pair.
 */
export interface Coordinates {
  readonly latitude: number;
  readonly longitude: number;
}

/**
 * Mean Earth radius in kilometers (IUGG).
 */
const EARTH_RADIUS_KM = 6371.0088;

/**
 * Calculates the great-circle distance between two geographic coordinates
 * using the Haversine formula.
 *
 * @param origin - Starting coordinates (latitude & longitude).
 * @param destination - Target coordinates (latitude & longitude).
 * @returns Great-circle distance rounded to 1 decimal place (minimum 0.1 km if distinct, 0 if identical).
 */
export function calculateHaversineDistanceKm(
  origin: Coordinates,
  destination: Coordinates
): number {
  if (
    origin.latitude === destination.latitude &&
    origin.longitude === destination.longitude
  ) {
    return 0;
  }

  const toRadians = (deg: number): number => (deg * Math.PI) / 180;

  const lat1 = toRadians(origin.latitude);
  const lat2 = toRadians(destination.latitude);
  const deltaLat = toRadians(destination.latitude - origin.latitude);
  const deltaLon = toRadians(destination.longitude - origin.longitude);

  const sinHalfDeltaLat = Math.sin(deltaLat / 2);
  const sinHalfDeltaLon = Math.sin(deltaLon / 2);

  const a =
    sinHalfDeltaLat * sinHalfDeltaLat +
    Math.cos(lat1) * Math.cos(lat2) * sinHalfDeltaLon * sinHalfDeltaLon;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const rawDistance = EARTH_RADIUS_KM * c;

  const rounded = Math.round(rawDistance * 10) / 10;
  return Math.max(0.1, rounded);
}

/**
 * Formats coordinates into a readable WGS84 string.
 *
 * @param coords - Coordinates object.
 * @param digits - Decimal precision (default: 4).
 * @returns Formatted coordinates string, e.g. "50.0647, 19.9450".
 */
export function formatCoordinates(
  coords: Coordinates,
  digits: number = 4
): string {
  return `${coords.latitude.toFixed(digits)}, ${coords.longitude.toFixed(digits)}`;
}
