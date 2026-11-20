import { describe, expect, it } from "vitest";
import { findFlagFact, loadLocalFacts } from "./facts";

describe("findFlagFact with local facts", () => {
  const english = findFlagFact("ES");

  it("gives the English fact without local facts", () => {
    expect(english?.funFact).toBeTruthy();
    expect(findFlagFact("ES", null)).toEqual(english);
  });

  it("uses the local text and keeps the English source link", () => {
    const fact = findFlagFact("ES", { ES: { funFact: "Un dato." } });
    expect(fact?.funFact).toBe("Un dato.");
    expect(fact?.sourceUrl).toBe(english?.sourceUrl);
  });

  it("falls back to English for a country without a local fact", () => {
    expect(findFlagFact("ES", { FR: { funFact: "Un fait." } })).toEqual(english);
  });

  it("finds nothing for a code that is not a country", () => {
    expect(findFlagFact("XX", { XX: { funFact: "Un fait." } })).toBeNull();
  });
});

describe("loadLocalFacts", () => {
  it("has no facts for English", async () => {
    expect(await loadLocalFacts("en")).toBeNull();
  });
});
