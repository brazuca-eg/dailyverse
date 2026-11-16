import { describe, expect, it } from "vitest";
import { countries } from "./countries";
import { foldText } from "./text";
import type { Continent } from "./types";

interface Bounds {
  lat: [number, number];
  lng: [number, number];
}

const CONTINENT_BOUNDS: Record<Continent, Bounds> = {
  Africa: { lat: [-36, 38], lng: [-26, 60] },
  Asia: { lat: [-12, 78], lng: [30, 180] },
  Europe: { lat: [34, 72], lng: [-25, 105] },
  "North America": { lat: [5, 75], lng: [-170, -50] },
  "South America": { lat: [-56, 13], lng: [-82, -34] },
  Oceania: { lat: [-50, 15], lng: [-180, 180] },
};

describe("countries data", () => {
  it("lists at least one nationality word for every country", () => {
    for (const country of countries) {
      expect(country.demonyms?.length ?? 0, country.name).toBeGreaterThan(0);
    }
  });

  it("covers every UN member state and the extra territories", () => {
    expect(countries.length).toBe(197);
  });

  it("has unique two-letter uppercase codes", () => {
    expect(new Set(countries.map((country) => country.code)).size).toBe(countries.length);
    for (const country of countries) {
      expect(country.code, country.name).toMatch(/^[A-Z]{2}$/);
    }
  });

  it("has no name or alias used by more than one country", () => {
    const labels = countries.flatMap((country) =>
      [country.name, ...country.aliases].map((label) => foldText(label)),
    );
    const duplicates = labels.filter((label, index) => labels.indexOf(label) !== index);
    expect(duplicates).toEqual([]);
  });

  it("has a name, a known continent and coordinates for every country", () => {
    for (const country of countries) {
      expect(country.name.length, country.code).toBeGreaterThan(0);
      expect(Object.keys(CONTINENT_BOUNDS), country.name).toContain(country.continent);
      expect(Number.isFinite(country.lat), country.name).toBe(true);
      expect(Number.isFinite(country.lng), country.name).toBe(true);
    }
  });

  it("places every country inside its continent's bounds", () => {
    for (const country of countries) {
      const bounds = CONTINENT_BOUNDS[country.continent];
      expect(country.lat, `${country.name} latitude`).toBeGreaterThanOrEqual(bounds.lat[0]);
      expect(country.lat, `${country.name} latitude`).toBeLessThanOrEqual(bounds.lat[1]);
      expect(country.lng, `${country.name} longitude`).toBeGreaterThanOrEqual(bounds.lng[0]);
      expect(country.lng, `${country.name} longitude`).toBeLessThanOrEqual(bounds.lng[1]);
    }
  });

  it("places Oceania in the Pacific, east of 110 degrees or west of -150", () => {
    for (const country of countries.filter((candidate) => candidate.continent === "Oceania")) {
      expect(country.lng >= 110 || country.lng <= -150, country.name).toBe(true);
    }
  });

  it("is sorted alphabetically by name", () => {
    const names = countries.map((country) => foldText(country.name));
    expect(names).toEqual([...names].sort());
  });
});
