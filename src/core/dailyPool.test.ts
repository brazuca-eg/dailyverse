import { describe, expect, it } from "vitest";
import { DIFFICULTIES, WEEKLY_DIFFICULTY_PATTERN } from "./difficulty";
import { pickPoolIndex, readTierOfDay } from "./dailyPool";

const SIZES = { easy: 210, medium: 315, hard: 210 };
const DAYS = Array.from({ length: 730 }, (_, day) => day);

describe("readTierOfDay", () => {
  it("follows the weekly pattern, also before the launch", () => {
    DAYS.slice(0, 21).forEach((day) =>
      expect(readTierOfDay(day)).toBe(WEEKLY_DIFFICULTY_PATTERN[day % 7]),
    );
    expect(readTierOfDay(-1)).toBe(WEEKLY_DIFFICULTY_PATTERN[6]);
    expect(readTierOfDay(-7)).toBe(WEEKLY_DIFFICULTY_PATTERN[0]);
  });
});

describe("pickPoolIndex", () => {
  it("names the tier of the day and an index inside that pool", () => {
    DAYS.forEach((day) => {
      const { tier, poolIndex } = pickPoolIndex("test", day, SIZES);
      expect(tier).toBe(readTierOfDay(day));
      expect(poolIndex).toBeGreaterThanOrEqual(0);
      expect(poolIndex).toBeLessThan(SIZES[tier]);
    });
  });

  it("gives the same answer every time", () => {
    DAYS.slice(0, 50).forEach((day) => {
      expect(pickPoolIndex("test", day, SIZES)).toEqual(pickPoolIndex("test", day, SIZES));
    });
  });

  it("never repeats a puzzle in two years", () => {
    const keys = DAYS.map((day) => {
      const { tier, poolIndex } = pickPoolIndex("test", day, SIZES);
      return `${tier}:${poolIndex}`;
    });
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("uses each puzzle of a pool once before any comes round again", () => {
    DIFFICULTIES.forEach((tier) => {
      const seen = Array.from({ length: 3000 }, (_, day) => pickPoolIndex("test", day, SIZES))
        .filter((pick) => pick.tier === tier)
        .slice(0, SIZES[tier])
        .map((pick) => pick.poolIndex);
      expect(seen).toHaveLength(SIZES[tier]);
      expect(new Set(seen).size).toBe(SIZES[tier]);
    });
  });

  it("shuffles each namespace differently", () => {
    const first = DAYS.slice(0, 40).map((day) => pickPoolIndex("one", day, SIZES).poolIndex);
    const second = DAYS.slice(0, 40).map((day) => pickPoolIndex("two", day, SIZES).poolIndex);
    expect(first).not.toEqual(second);
  });

  it("does not hand out a pool in its stored order", () => {
    const first = DAYS.map((day) => pickPoolIndex("test", day, SIZES))
      .filter((pick) => pick.tier === "easy")
      .slice(0, 10)
      .map((pick) => pick.poolIndex);
    expect(first).not.toEqual(Array.from({ length: 10 }, (_, index) => index));
  });

  it("starts again after a pool is used up, and works for negative days", () => {
    [-100, -1, 7 * 5000].forEach((day) => {
      const { tier, poolIndex } = pickPoolIndex("test", day, SIZES);
      expect(poolIndex).toBeLessThan(SIZES[tier]);
    });
  });

  it("uses the pool sizes it is given", () => {
    const small = { easy: 1, medium: 2, hard: 3 };
    DAYS.slice(0, 100).forEach((day) => {
      const { tier, poolIndex } = pickPoolIndex("test", day, small);
      expect(poolIndex).toBeLessThan(small[tier]);
    });
  });
});
