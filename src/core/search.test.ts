import { describe, expect, it } from "vitest";
import countries from "./countries.json";
import { findCountryByName, searchCountries } from "./search";
import type { Country } from "./types";

const typedCountries = countries as Country[];

function searchNames(query: string, excludedCodes: string[] = [], limit?: number): string[] {
  return searchCountries(typedCountries, query, excludedCodes, limit).map((c) => c.name);
}

describe("findCountryByName", () => {
  it("finds a country by its exact name, ignoring case and spaces", () => {
    expect(findCountryByName(typedCountries, "  BrAzIl ")?.code).toBe("BR");
  });

  it("finds a country by an alias", () => {
    expect(findCountryByName(typedCountries, "uk")?.code).toBe("GB");
  });

  it("returns null for partial or unknown names", () => {
    expect(findCountryByName(typedCountries, "braz")).toBeNull();
    expect(findCountryByName(typedCountries, "atlantis")).toBeNull();
    expect(findCountryByName(typedCountries, "")).toBeNull();
  });
});

describe("searchCountries", () => {
  it("returns nothing for an empty or blank query", () => {
    expect(searchCountries(typedCountries, "")).toEqual([]);
    expect(searchCountries(typedCountries, "   ")).toEqual([]);
  });

  it("matches the start of a name, ignoring case", () => {
    expect(searchNames("SWIT")).toEqual(["Switzerland"]);
  });

  it("ranks name prefixes before substring matches", () => {
    const sample: Country[] = ["Somalia", "Mali", "Malta"].map((name, index) => ({
      code: `X${index}`,
      name,
      aliases: [],
      continent: "Africa",
      lat: 0,
      lng: 0,
    }));
    expect(searchCountries(sample, "mal").map((c) => c.name)).toEqual(["Mali", "Malta", "Somalia"]);
  });

  it("matches aliases", () => {
    expect(searchNames("aotearoa")).toEqual(["New Zealand"]);
    expect(searchNames("ivory")).toEqual(["Côte d'Ivoire"]);
  });

  it("ranks an exact name or alias before longer prefix matches", () => {
    expect(searchNames("uk")).toEqual(["United Kingdom", "Ukraine"]);
    expect(searchNames("usa")[0]).toBe("United States");
    expect(searchNames("congo")[0]).toBe("Republic of the Congo");
    expect(searchNames("niger")).toEqual(["Niger", "Nigeria"]);
  });

  it("lists every name prefix match alphabetically", () => {
    expect(searchNames("united")).toEqual([
      "United Arab Emirates",
      "United Kingdom",
      "United States",
    ]);
  });

  it("excludes already guessed countries", () => {
    expect(searchNames("united", ["GB"])).toEqual(["United Arab Emirates", "United States"]);
  });

  it("finds accented names without typing accents", () => {
    expect(searchNames("cote")).toEqual(["Côte d'Ivoire"]);
    expect(searchNames("sao tome")).toEqual(["São Tomé and Príncipe"]);
  });

  it("respects the result limit", () => {
    expect(searchNames("a", [], 3)).toHaveLength(3);
  });

  it("ignores diacritics in the query", () => {
    const withAccent: Country[] = [
      { code: "CW", name: "Curaçao", aliases: [], continent: "North America", lat: 12, lng: -69 },
    ];
    expect(searchCountries(withAccent, "curacao")).toHaveLength(1);
    expect(searchCountries(withAccent, "curaçao")).toHaveLength(1);
  });
});
