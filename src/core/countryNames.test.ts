import { describe, expect, it } from "vitest";
import { readCountryName } from "./countryNames";
import { searchCountries, findCountryByName } from "./search";
import type { Country } from "./types";

const germany: Country = {
  code: "DE",
  name: "Germany",
  aliases: [],
  continent: "Europe",
  lat: 51,
  lng: 10,
};
const ukraine: Country = {
  code: "UA",
  name: "Ukraine",
  aliases: [],
  continent: "Europe",
  lat: 49,
  lng: 32,
};
const countries = [germany, ukraine];

describe("readCountryName", () => {
  it("gives the name in the language asked for", () => {
    expect(readCountryName(germany, "en")).toBe("Germany");
    expect(readCountryName(germany, "de")).toBe("Deutschland");
    expect(readCountryName(germany, "es")).toBe("Alemania");
    expect(readCountryName(germany, "fr")).toBe("Allemagne");
    expect(readCountryName(germany, "it")).toBe("Germania");
    expect(readCountryName(ukraine, "uk")).toBe("Україна");
  });

  it("falls back to the English name for a code the browser does not know", () => {
    const made: Country = { ...germany, code: "QQ", name: "Madeupland" };
    expect(readCountryName(made, "de")).toBe("Madeupland");
  });
});

describe("searching in another language", () => {
  it("finds a country by its name in that language", () => {
    expect(searchCountries(countries, "deutsch", [], 8, "de")).toEqual([germany]);
    expect(searchCountries(countries, "україн", [], 8, "uk")).toEqual([ukraine]);
  });

  it("still finds a country by its English name", () => {
    expect(searchCountries(countries, "germ", [], 8, "de")).toEqual([germany]);
  });

  it("ignores accents in the language of the player", () => {
    expect(searchCountries(countries, "alemania", [], 8, "es")).toEqual([germany]);
  });

  it("finds a country by exact name in that language", () => {
    expect(findCountryByName(countries, "Deutschland", "de")).toBe(germany);
    expect(findCountryByName(countries, "Germany", "de")).toBe(germany);
    expect(findCountryByName(countries, "Deutschland", "en")).toBeNull();
  });
});
