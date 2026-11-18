import { describe, expect, it } from "vitest";
import { pickDailyPeakPuzzle } from "../../src/games/peak-order/daily";
import { peakData } from "../../src/games/peak-order/data";
import type { PeakData } from "../../src/games/peak-order/types";
import { listDayIssues, verifyDays } from "./verify-days";

function clone(): PeakData {
  return structuredClone(peakData);
}

describe("verifyDays", () => {
  it("accepts the first two years of puzzles", () => {
    expect(verifyDays(0, 730, peakData)).toEqual([]);
  });

  it("accepts days before the launch", () => {
    expect(verifyDays(-100, 100, peakData)).toEqual([]);
  });

  it("reports a day whose puzzle breaks the tier rules", () => {
    const data = clone();
    const { category, tier, poolIndex } = pickDailyPeakPuzzle(0, data);
    data[category][tier][poolIndex] = [...data[category][tier][poolIndex]].reverse();
    const issues = listDayIssues(0, data);
    expect(issues).toHaveLength(1);
    expect(issues[0]).toContain("does not fit the");
  });

  it("reports an item less known than the cut-off", () => {
    const data = clone();
    const { category, tier } = pickDailyPeakPuzzle(0, data);
    data[category].minEditions[tier] = 100000;
    expect(listDayIssues(0, data).join()).toContain("does not fit");
  });

  it("reports a puzzle that comes round twice in the range", () => {
    const data = clone();
    CATEGORY_POOLS.forEach(([category, tier]) => {
      data[category][tier] = data[category][tier].slice(0, 1);
    });
    const failures = verifyDays(0, 80, data);
    expect(failures.length).toBeGreaterThan(0);
    expect(failures.every((report) => report.issues.includes("repeats an earlier day"))).toBe(true);
    expect(failures.find((report) => report.day === 0)).toBeUndefined();
  });
});

const CATEGORY_POOLS = (["mountains", "rivers", "lakes", "islands", "volcanoes"] as const).flatMap(
  (category) => (["medium", "hard"] as const).map((tier) => [category, tier] as const),
);
