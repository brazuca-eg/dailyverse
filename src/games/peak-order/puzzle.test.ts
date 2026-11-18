import { describe, expect, it } from "vitest";
import { countFixedPoints } from "./arrange";
import { CATEGORY_IDS } from "./categories";
import { peakData } from "./data";
import { pickDailyPeakPuzzle } from "./daily";
import { buildDailyPeakPuzzle, buildPeakPuzzle } from "./puzzle";
import { fitsTier, ROUND_SIZE } from "./tiers";

const DAYS = Array.from({ length: 150 }, (_, day) => day);

describe("buildPeakPuzzle", () => {
  it("names its category, tier and place in the pool", () => {
    const puzzle = buildPeakPuzzle("rivers", "hard", 4);
    expect(puzzle.id).toBe("rivers:hard:4");
    expect(puzzle.category).toBe("rivers");
    expect(puzzle.tier).toBe("hard");
  });

  it("lists five items from lowest to highest value, with different names", () => {
    DAYS.forEach((day) => {
      const { items } = buildDailyPeakPuzzle(day);
      expect(items).toHaveLength(ROUND_SIZE);
      expect(items.map((item) => item.value)).toEqual(
        [...items.map((item) => item.value)].sort((a, b) => a - b),
      );
      expect(new Set(items.map((item) => item.value)).size).toBe(ROUND_SIZE);
      expect(new Set(items.map((item) => item.name)).size).toBe(ROUND_SIZE);
    });
  });

  it("takes names and values from the data", () => {
    const puzzle = buildPeakPuzzle("lakes", "medium", 0);
    const indexes = peakData.lakes.medium[0];
    expect(puzzle.items).toEqual(
      indexes.map((index) => ({
        name: peakData.lakes.items[index][0],
        value: peakData.lakes.items[index][1],
      })),
    );
  });

  it("fits the rules of its tier", () => {
    DAYS.forEach((day) => {
      const puzzle = buildDailyPeakPuzzle(day);
      const set = puzzle.items.map((item) => ({
        ...item,
        editions: peakData[puzzle.category].minEditions[puzzle.tier],
      }));
      expect(fitsTier(set, puzzle.tier, peakData[puzzle.category].minEditions[puzzle.tier])).toBe(
        true,
      );
    });
  });

  it("starts scrambled: a full permutation that is never solved and gives away at most one position", () => {
    DAYS.forEach((day) => {
      const { start } = buildDailyPeakPuzzle(day);
      expect([...start].sort()).toEqual([0, 1, 2, 3, 4]);
      expect(countFixedPoints(start)).toBeLessThanOrEqual(1);
    });
  });

  it("gives the same puzzle and the same start every time", () => {
    expect(buildPeakPuzzle("islands", "medium", 12)).toEqual(
      buildPeakPuzzle("islands", "medium", 12),
    );
  });

  it("starts different puzzles in different ways", () => {
    const starts = new Set(DAYS.map((day) => buildDailyPeakPuzzle(day).start.join("")));
    expect(starts.size).toBeGreaterThan(10);
  });

  it("covers every puzzle of every pool", () => {
    CATEGORY_IDS.forEach((category) => {
      (["medium", "hard"] as const).forEach((tier) => {
        peakData[category][tier].forEach((_, index) => {
          expect(buildPeakPuzzle(category, tier, index).items).toHaveLength(ROUND_SIZE);
        });
      });
    });
  });

  it("refuses a puzzle that is not in the pool", () => {
    expect(() => buildPeakPuzzle("lakes", "hard", 9999)).toThrow(
      "no hard lakes puzzle number 9999",
    );
    expect(() => buildPeakPuzzle("lakes", "hard", -1)).toThrow();
  });
});

describe("buildDailyPeakPuzzle", () => {
  it("builds the puzzle that the daily pick names", () => {
    DAYS.slice(0, 40).forEach((day) => {
      const { category, tier, poolIndex } = pickDailyPeakPuzzle(day);
      expect(buildDailyPeakPuzzle(day).id).toBe(`${category}:${tier}:${poolIndex}`);
    });
  });

  it("is quick, because it runs in the browser", () => {
    const started = performance.now();
    DAYS.forEach((day) => buildDailyPeakPuzzle(day));
    expect((performance.now() - started) / DAYS.length).toBeLessThan(5);
  });
});
