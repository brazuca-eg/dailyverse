import { describe, expect, it } from "vitest";
import type { PuzzleMetrics } from "./analysis";
import { fitsTier, TIER_RULES, TRAIL_TIERS } from "./tiers";

const medium: PuzzleMetrics = {
  words: 60,
  commonWords: 40,
  commonPangrams: 1,
  allPangrams: 2,
  fourLetterShare: 0.3,
  maxScore: 100,
};

const hard: PuzzleMetrics = { ...medium, commonWords: 22, allPangrams: 1, fourLetterShare: 0.2 };

describe("TIER_RULES", () => {
  it("has two tiers, medium and hard, and no easy one", () => {
    expect(TRAIL_TIERS).toEqual(["medium", "hard"]);
  });

  it("makes the tiers disjoint, so a puzzle belongs to one of them", () => {
    expect(TIER_RULES.hard.maxWords).toBeLessThan(TIER_RULES.medium.minWords);
  });

  it("has enough puzzles in each pool for years of days", () => {
    expect(TIER_RULES.medium.poolSize).toBeGreaterThanOrEqual(1000);
    expect(TIER_RULES.hard.poolSize).toBeGreaterThanOrEqual(1000);
  });
});

describe("fitsTier", () => {
  it("accepts a typical medium and a typical hard puzzle for their own tier only", () => {
    expect(fitsTier(medium, "medium")).toBe(true);
    expect(fitsTier(medium, "hard")).toBe(false);
    expect(fitsTier(hard, "hard")).toBe(true);
    expect(fitsTier(hard, "medium")).toBe(false);
  });

  it("is inclusive at the edges of the word counts", () => {
    expect(fitsTier({ ...medium, commonWords: TIER_RULES.medium.minWords }, "medium")).toBe(true);
    expect(fitsTier({ ...medium, commonWords: TIER_RULES.medium.minWords - 1 }, "medium")).toBe(
      false,
    );
    expect(fitsTier({ ...medium, commonWords: TIER_RULES.medium.maxWords }, "medium")).toBe(true);
    expect(fitsTier({ ...medium, commonWords: TIER_RULES.medium.maxWords + 1 }, "medium")).toBe(
      false,
    );
    expect(fitsTier({ ...hard, commonWords: TIER_RULES.hard.minWords }, "hard")).toBe(true);
    expect(fitsTier({ ...hard, commonWords: TIER_RULES.hard.minWords - 1 }, "hard")).toBe(false);
    expect(fitsTier({ ...hard, commonWords: TIER_RULES.hard.maxWords }, "hard")).toBe(true);
    expect(fitsTier({ ...hard, commonWords: TIER_RULES.hard.maxWords + 1 }, "hard")).toBe(false);
  });

  it("needs a common pangram, and at most the tier's number of them", () => {
    expect(fitsTier({ ...medium, commonPangrams: 0 }, "medium")).toBe(false);
    expect(fitsTier({ ...medium, commonPangrams: 2 }, "medium")).toBe(true);
    expect(fitsTier({ ...medium, commonPangrams: 3 }, "medium")).toBe(false);
    expect(fitsTier({ ...hard, commonPangrams: 2 }, "hard")).toBe(false);
  });

  it("limits the pangrams that count when obscure ones are included", () => {
    expect(fitsTier({ ...medium, allPangrams: TIER_RULES.medium.maxAllPangrams }, "medium")).toBe(
      true,
    );
    expect(
      fitsTier({ ...medium, allPangrams: TIER_RULES.medium.maxAllPangrams + 1 }, "medium"),
    ).toBe(false);
    expect(fitsTier({ ...hard, allPangrams: TIER_RULES.hard.maxAllPangrams + 1 }, "hard")).toBe(
      false,
    );
  });

  it("limits how many of the words are only four letters long", () => {
    expect(
      fitsTier({ ...medium, fourLetterShare: TIER_RULES.medium.maxFourLetterShare }, "medium"),
    ).toBe(true);
    expect(
      fitsTier(
        { ...medium, fourLetterShare: TIER_RULES.medium.maxFourLetterShare + 0.01 },
        "medium",
      ),
    ).toBe(false);
    expect(
      fitsTier({ ...hard, fourLetterShare: TIER_RULES.hard.maxFourLetterShare + 0.01 }, "hard"),
    ).toBe(false);
  });

  it("asks more of a hard puzzle than a medium one", () => {
    expect(TIER_RULES.hard.maxFourLetterShare).toBeLessThan(TIER_RULES.medium.maxFourLetterShare);
    expect(TIER_RULES.hard.maxCommonPangrams).toBeLessThan(TIER_RULES.medium.maxCommonPangrams);
    expect(TIER_RULES.hard.maxWords).toBeLessThan(TIER_RULES.medium.maxWords);
  });
});
