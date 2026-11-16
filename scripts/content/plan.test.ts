import { describe, expect, it } from "vitest";
import { countries } from "../../src/core/countries";
import { planBatch } from "./plan";
import { EASY_CODES, MEDIUM_CODES, resolveTier } from "./tiers";
import { getWikipediaTitle } from "./titles";
import { requireCountry } from "../../src/core/testing";

describe("tiers", () => {
  const allCodes = new Set(countries.map((country) => country.code));

  it("only lists real countries", () => {
    for (const code of [...EASY_CODES, ...MEDIUM_CODES]) {
      expect(allCodes.has(code), code).toBe(true);
    }
  });

  it("never lists a country in two tiers or twice", () => {
    const listed = [...EASY_CODES, ...MEDIUM_CODES];
    expect(new Set(listed).size).toBe(listed.length);
  });

  it("resolves tiers, defaulting to hard", () => {
    expect(resolveTier("US")).toBe("easy");
    expect(resolveTier("VE")).toBe("medium");
    expect(resolveTier("TV")).toBe("hard");
  });
});

describe("getWikipediaTitle", () => {
  it("uses the country name unless Wikipedia names the article differently", () => {
    const byCode = (code: string) => requireCountry(code);
    expect(getWikipediaTitle(byCode("FR"))).toBe("France");
    expect(getWikipediaTitle(byCode("GE"))).toBe("Georgia (country)");
    expect(getWikipediaTitle(byCode("IE"))).toBe("Republic of Ireland");
    expect(getWikipediaTitle(byCode("GM"))).toBe("The Gambia");
  });
});

describe("planBatch", () => {
  const none = new Set<string>();

  it("plans the requested number of puzzles with a mixed difficulty pattern", () => {
    const planned = planBatch(countries, none, 7, 1);
    expect(planned).toHaveLength(7);
    expect(planned.map((entry) => entry.difficulty)).toEqual([
      "easy",
      "medium",
      "hard",
      "medium",
      "easy",
      "medium",
      "hard",
    ]);
  });

  it("picks a different country each time", () => {
    const codes = planBatch(countries, none, 14, 3).map((entry) => entry.country.code);
    expect(new Set(codes).size).toBe(14);
  });

  it("never picks an unavailable country", () => {
    const unavailable = new Set(countries.slice(0, 150).map((country) => country.code));
    for (const entry of planBatch(countries, unavailable, 14, 5)) {
      expect(unavailable.has(entry.country.code)).toBe(false);
    }
  });

  it("is deterministic for a seed and varies between seeds", () => {
    const first = planBatch(countries, none, 7, 20261116).map((entry) => entry.country.code);
    const again = planBatch(countries, none, 7, 20261116).map((entry) => entry.country.code);
    const other = planBatch(countries, none, 7, 20261123).map((entry) => entry.country.code);
    expect(again).toEqual(first);
    expect(other).not.toEqual(first);
  });

  it("avoids repeating a continent back to back when it can", () => {
    const planned = planBatch(countries, none, 14, 7);
    const repeats = planned.filter(
      (entry, index) =>
        index > 0 && entry.country.continent === planned[index - 1].country.continent,
    );
    expect(repeats).toHaveLength(0);
  });

  it("labels a puzzle with the tier of the country it actually picked", () => {
    for (const entry of planBatch(countries, none, 14, 9)) {
      expect(resolveTier(entry.country.code)).toBe(entry.difficulty);
    }
  });

  it("falls back to other tiers when one runs out", () => {
    const hardCodes = countries
      .filter((country) => resolveTier(country.code) === "hard")
      .map((c) => c.code);
    const planned = planBatch(countries, new Set(hardCodes), 7, 2);
    expect(planned).toHaveLength(7);
    expect(planned.every((entry) => entry.difficulty !== "hard")).toBe(true);
  });

  it("returns fewer puzzles when there are not enough countries", () => {
    const keep = new Set(countries.slice(0, 3).map((country) => country.code));
    const unavailable = new Set(
      countries.filter((country) => !keep.has(country.code)).map((c) => c.code),
    );
    expect(planBatch(countries, unavailable, 7, 1)).toHaveLength(3);
  });
});
