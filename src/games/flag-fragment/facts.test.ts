import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { countries } from "../../core/countries";
import { deriveFlagFacts, type FlagFactDraft } from "../../../scripts/flags/facts";
import { findFlagFact } from "./facts";

const drafts = JSON.parse(
  readFileSync(new URL("../../../content/flag-facts.json", import.meta.url), "utf8"),
) as FlagFactDraft[];

describe("flag facts", () => {
  it("has a fact for every country", () => {
    const missing = countries.filter((country) => findFlagFact(country.code) === null);
    expect(missing).toEqual([]);
  });

  it("links every fact to the Wikipedia article it was checked against", () => {
    countries.forEach((country) => {
      expect(findFlagFact(country.code)?.sourceUrl).toMatch(
        /^https:\/\/en\.wikipedia\.org\/wiki\//,
      );
    });
  });

  it("is the checked source file, so nothing unchecked can ship", () => {
    countries.forEach((country) => {
      expect(findFlagFact(country.code)).toEqual(deriveFlagFacts(drafts)[country.code]);
    });
  });

  it("returns null for an unknown country", () => {
    expect(findFlagFact("ZZ")).toBeNull();
  });
});
