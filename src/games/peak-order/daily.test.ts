import { describe, expect, it } from "vitest";
import { CATEGORY_IDS } from "./categories";
import { peakData } from "./data";
import { pickDailyPeakPuzzle } from "./daily";
import { PEAK_TIERS, PEAK_WEEKLY_PATTERN } from "./tiers";
import type { PeakData } from "./types";

const DAYS = Array.from({ length: 730 }, (_, day) => day);

describe("pickDailyPeakPuzzle", () => {
  it("rotates through the categories, one a day, never the same twice in a row", () => {
    DAYS.slice(0, 40).forEach((day) => {
      expect(pickDailyPeakPuzzle(day).category).toBe(CATEGORY_IDS[day % 5]);
      expect(pickDailyPeakPuzzle(day).category).not.toBe(pickDailyPeakPuzzle(day + 1).category);
    });
  });

  it("follows the weekly pattern for the tier", () => {
    DAYS.slice(0, 28).forEach((day) => {
      expect(pickDailyPeakPuzzle(day).tier).toBe(PEAK_WEEKLY_PATTERN[day % 7]);
    });
  });

  it("picks a puzzle that exists in the pool of its category and tier", () => {
    DAYS.forEach((day) => {
      const { category, tier, poolIndex } = pickDailyPeakPuzzle(day);
      expect(Number.isInteger(poolIndex)).toBe(true);
      expect(peakData[category][tier][poolIndex]).toBeDefined();
    });
  });

  it("gives the same puzzle every time for the same day", () => {
    DAYS.slice(0, 60).forEach((day) => {
      expect(pickDailyPeakPuzzle(day)).toEqual(pickDailyPeakPuzzle(day));
    });
  });

  it("never repeats a puzzle in the first two years", () => {
    const keys = DAYS.map((day) => {
      const { category, tier, poolIndex } = pickDailyPeakPuzzle(day);
      return `${category}:${tier}:${poolIndex}`;
    });
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("uses each puzzle of a pool once before any comes round again", () => {
    CATEGORY_IDS.forEach((category) => {
      PEAK_TIERS.forEach((tier) => {
        const size = peakData[category][tier].length;
        const seen = Array.from({ length: 3000 }, (_, day) => pickDailyPeakPuzzle(day))
          .filter((pick) => pick.category === category && pick.tier === tier)
          .slice(0, size)
          .map((pick) => pick.poolIndex);
        expect(seen).toHaveLength(size);
        expect(new Set(seen).size).toBe(size);
      });
    });
  });

  it("does not hand out a pool in its stored order", () => {
    const first = DAYS.map((day) => pickDailyPeakPuzzle(day))
      .filter((pick) => pick.category === "mountains" && pick.tier === "medium")
      .slice(0, 10)
      .map((pick) => pick.poolIndex);
    expect(first).not.toEqual(Array.from({ length: 10 }, (_, index) => index));
  });

  it("works for days before the launch", () => {
    [-1, -7, -8, -35, -100].forEach((day) => {
      const { category, tier, poolIndex } = pickDailyPeakPuzzle(day);
      expect(peakData[category][tier][poolIndex]).toBeDefined();
    });
    expect(pickDailyPeakPuzzle(-1).category).toBe(CATEGORY_IDS[4]);
    expect(pickDailyPeakPuzzle(-1).tier).toBe(PEAK_WEEKLY_PATTERN[6]);
  });

  it("starts the pools again after they are used up", () => {
    const far = 35 * 5000;
    const { category, tier, poolIndex } = pickDailyPeakPuzzle(far);
    expect(peakData[category][tier][poolIndex]).toBeDefined();
  });

  it("uses the size of the data it is given", () => {
    const small = structuredClone(peakData) as PeakData;
    CATEGORY_IDS.forEach((category) => {
      small[category].medium = small[category].medium.slice(0, 3);
      small[category].hard = small[category].hard.slice(0, 2);
    });
    DAYS.slice(0, 200).forEach((day) => {
      const { category, tier, poolIndex } = pickDailyPeakPuzzle(day, small);
      expect(poolIndex).toBeLessThan(small[category][tier].length);
    });
  });
});
