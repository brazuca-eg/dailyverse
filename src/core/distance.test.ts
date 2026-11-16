import { describe, expect, it } from "vitest";
import {
  calculateBearingDegrees,
  calculateDistanceKm,
  calculateProximityPercent,
  compareGuessToAnswer,
  toCompassDirection,
} from "./distance";
import { requireCountry, requireIncorrect } from "./testing";

describe("calculateDistanceKm", () => {
  it("returns 0 for identical points", () => {
    expect(calculateDistanceKm({ lat: 10, lng: 20 }, { lat: 10, lng: 20 })).toBe(0);
  });

  it("matches the known London to Paris distance", () => {
    const london = { lat: 51.5074, lng: -0.1278 };
    const paris = { lat: 48.8566, lng: 2.3522 };
    expect(calculateDistanceKm(london, paris)).toBeCloseTo(344, -1);
  });

  it("matches the known New York to Los Angeles distance", () => {
    const newYork = { lat: 40.7128, lng: -74.006 };
    const losAngeles = { lat: 34.0522, lng: -118.2437 };
    expect(calculateDistanceKm(newYork, losAngeles)).toBeCloseTo(3936, -2);
  });

  it("is symmetric", () => {
    const a = { lat: -41, lng: 174 };
    const b = { lat: 47, lng: 8 };
    expect(calculateDistanceKm(a, b)).toBeCloseTo(calculateDistanceKm(b, a), 6);
  });
});

describe("calculateBearingDegrees", () => {
  const origin = { lat: 0, lng: 0 };

  it("returns the four cardinal bearings", () => {
    expect(calculateBearingDegrees(origin, { lat: 10, lng: 0 })).toBeCloseTo(0, 6);
    expect(calculateBearingDegrees(origin, { lat: 0, lng: 10 })).toBeCloseTo(90, 6);
    expect(calculateBearingDegrees(origin, { lat: -10, lng: 0 })).toBeCloseTo(180, 6);
    expect(calculateBearingDegrees(origin, { lat: 0, lng: -10 })).toBeCloseTo(270, 6);
  });
});

describe("toCompassDirection", () => {
  it("maps bearings to the nearest of eight directions", () => {
    expect(toCompassDirection(0)).toBe("N");
    expect(toCompassDirection(22)).toBe("N");
    expect(toCompassDirection(23)).toBe("NE");
    expect(toCompassDirection(90)).toBe("E");
    expect(toCompassDirection(135)).toBe("SE");
    expect(toCompassDirection(180)).toBe("S");
    expect(toCompassDirection(225)).toBe("SW");
    expect(toCompassDirection(270)).toBe("W");
    expect(toCompassDirection(315)).toBe("NW");
    expect(toCompassDirection(359)).toBe("N");
  });

  it("normalizes negative and oversized bearings", () => {
    expect(toCompassDirection(-90)).toBe("W");
    expect(toCompassDirection(450)).toBe("E");
  });
});

describe("calculateProximityPercent", () => {
  it("is 100 for no distance and 0 at the far end of the world", () => {
    expect(calculateProximityPercent(0)).toBe(100);
    expect(calculateProximityPercent(20000)).toBe(0);
  });

  it("scales linearly in between", () => {
    expect(calculateProximityPercent(10000)).toBe(50);
    expect(calculateProximityPercent(2822)).toBe(86);
  });

  it("never leaves the 0 to 100 range", () => {
    expect(calculateProximityPercent(25000)).toBe(0);
    expect(calculateProximityPercent(-5)).toBe(100);
  });
});

describe("compareGuessToAnswer", () => {
  it("reports a correct guess without any distance or direction", () => {
    const brazil = requireCountry("BR");
    expect(compareGuessToAnswer(brazil, brazil)).toEqual({ isCorrect: true });
  });

  it("reports distance and direction for a wrong guess", () => {
    const feedback = requireIncorrect(
      compareGuessToAnswer(requireCountry("BR"), requireCountry("AR")),
    );
    expect(feedback.direction).toBe("S");
    expect(feedback.distanceKm).toBeGreaterThan(2000);
    expect(feedback.distanceKm).toBeLessThan(3500);
  });

  it("returns a whole number of kilometres", () => {
    const feedback = requireIncorrect(
      compareGuessToAnswer(requireCountry("CH"), requireCountry("JP")),
    );
    expect(Number.isInteger(feedback.distanceKm)).toBe(true);
  });
});
