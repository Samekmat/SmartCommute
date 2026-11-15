import { describe, expect, it } from "vitest";
import {
  calculateHaversineDistanceKm,
  formatCoordinates,
  Coordinates,
} from "../geo";

describe("Geographic calculation utilities", () => {
  it("calculates zero distance when origin and destination are identical", () => {
    const krakow: Coordinates = { latitude: 50.0647, longitude: 19.945 };
    const distance = calculateHaversineDistanceKm(krakow, krakow);
    expect(distance).toBe(0);
  });

  it("calculates realistic distance between Kraków Rynek and Warsaw Central (approx. 250-260 km)", () => {
    const krakow: Coordinates = { latitude: 50.0614, longitude: 19.9366 };
    const warsaw: Coordinates = { latitude: 52.2297, longitude: 21.0122 };

    const distance = calculateHaversineDistanceKm(krakow, warsaw);
    // Great circle distance Kraków -> Warsaw is ~252 km
    expect(distance).toBeGreaterThan(240);
    expect(distance).toBeLessThan(265);
    expect(distance).toBe(252.5);
  });

  it("calculates short commute distance between Kraków Rynek and Nowa Huta (approx. 8-9 km)", () => {
    const rynek: Coordinates = { latitude: 50.0614, longitude: 19.9366 };
    const nowaHuta: Coordinates = { latitude: 50.0716, longitude: 20.0375 };

    const distance = calculateHaversineDistanceKm(rynek, nowaHuta);
    expect(distance).toBeGreaterThan(7);
    expect(distance).toBeLessThan(10);
    expect(distance).toBe(7.3);
  });

  it("formats coordinates with default 4 decimals", () => {
    const coords: Coordinates = { latitude: 50.0647123, longitude: 19.9450456 };
    expect(formatCoordinates(coords)).toBe("50.0647, 19.9450");
  });

  it("formats coordinates with custom decimal precision", () => {
    const coords: Coordinates = { latitude: 50.0647123, longitude: 19.9450456 };
    expect(formatCoordinates(coords, 2)).toBe("50.06, 19.95");
  });
});
