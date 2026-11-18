import { describe, expect, it } from "vitest";
import type { Item } from "./items";
import {
  fitsTier,
  measureSet,
  PEAK_TIERS,
  PEAK_WEEKLY_PATTERN,
  ROUND_SIZE,
  TIER_RULES,
} from "./tiers";

function setOf(values: number[], editions = 100): Item[] {
  return values.map((value, index) => ({ name: `Peak ${"abcdefgh"[index]}`, value, editions }));
}

describe("rules", () => {
  it("make hard days closer in value and wider in fame than medium days", () => {
    expect(TIER_RULES.hard.minRatio).toBeLessThan(TIER_RULES.medium.minRatio);
    expect(TIER_RULES.hard.candidateCount).toBeGreaterThan(TIER_RULES.medium.candidateCount);
    expect(TIER_RULES.hard.maxClosestRatio).toBeLessThan(TIER_RULES.medium.minRatio);
  });

  it("need at least two years of puzzles in each category", () => {
    const mediumDays = (730 * PEAK_WEEKLY_PATTERN.filter((tier) => tier === "medium").length) / 7;
    const hardDays = (730 * PEAK_WEEKLY_PATTERN.filter((tier) => tier === "hard").length) / 7;
    expect(TIER_RULES.medium.poolSize * 5).toBeGreaterThanOrEqual(mediumDays);
    expect(TIER_RULES.hard.poolSize * 5).toBeGreaterThanOrEqual(hardDays);
  });

  it("list both tiers, and a round has five items", () => {
    expect(PEAK_TIERS).toEqual(["medium", "hard"]);
    expect(ROUND_SIZE).toBe(5);
  });
});

describe("PEAK_WEEKLY_PATTERN", () => {
  it("is a week of medium and hard days, with more medium than hard and no two hard days in a row", () => {
    expect(PEAK_WEEKLY_PATTERN).toHaveLength(7);
    expect(PEAK_WEEKLY_PATTERN.filter((tier) => tier === "medium")).toHaveLength(4);
    PEAK_WEEKLY_PATTERN.forEach((tier, index) => {
      expect(tier === "hard" && PEAK_WEEKLY_PATTERN[(index + 1) % 7] === "hard").toBe(false);
    });
  });
});

describe("measureSet", () => {
  it("finds the closest pair, the least known item and whether the values rise", () => {
    const items = [
      { name: "a", value: 100, editions: 90 },
      { name: "b", value: 200, editions: 40 },
      { name: "c", value: 210, editions: 70 },
    ];
    expect(measureSet(items)).toEqual({ closestRatio: 1.05, minEditions: 40, isAscending: true });
  });

  it("notices values that do not rise", () => {
    expect(measureSet(setOf([100, 100, 300])).isAscending).toBe(false);
    expect(measureSet(setOf([300, 200, 100])).isAscending).toBe(false);
  });
});

describe("fitsTier", () => {
  const spread = [100, 200, 400, 800, 1600];

  it("accepts a well-spread set of known items as medium", () => {
    expect(fitsTier(setOf(spread), "medium", 50)).toBe(true);
  });

  it("needs every gap in a medium set to be at least 15%", () => {
    expect(fitsTier(setOf([1000, 1150, 2000, 3000, 4000]), "medium", 50)).toBe(true);
    expect(fitsTier(setOf([1000, 1149, 2000, 3000, 4000]), "medium", 50)).toBe(false);
  });

  it("needs a close pair in a hard set, between 3% and 8% apart", () => {
    expect(fitsTier(setOf([1000, 1030, 2000, 3000, 4000]), "hard", 50)).toBe(true);
    expect(fitsTier(setOf([1000, 1080, 2000, 3000, 4000]), "hard", 50)).toBe(true);
    expect(fitsTier(setOf([1000, 1029, 2000, 3000, 4000]), "hard", 50)).toBe(false);
    expect(fitsTier(setOf([1000, 1081, 2000, 3000, 4000]), "hard", 50)).toBe(false);
    expect(fitsTier(setOf(spread), "hard", 50)).toBe(false);
  });

  it("does not accept a hard set as medium or the other way round", () => {
    expect(fitsTier(setOf([1000, 1050, 2000, 3000, 4000]), "medium", 50)).toBe(false);
  });

  it("checks how well known the least known item is, exactly at the cut-off", () => {
    const items = setOf(spread);
    items[2] = { ...items[2], editions: 49 };
    expect(fitsTier(items, "medium", 50)).toBe(false);
    items[2] = { ...items[2], editions: 50 };
    expect(fitsTier(items, "medium", 50)).toBe(true);
  });

  it("needs five items, rising and with different names", () => {
    expect(fitsTier(setOf(spread.slice(0, 4)), "medium", 50)).toBe(false);
    expect(fitsTier(setOf([...spread, 3200]), "medium", 50)).toBe(false);
    expect(fitsTier(setOf([...spread].reverse()), "medium", 50)).toBe(false);
    const sameName = setOf(spread).map((item) => ({ ...item, name: "Peak a" }));
    expect(fitsTier(sameName, "medium", 50)).toBe(false);
  });
});
