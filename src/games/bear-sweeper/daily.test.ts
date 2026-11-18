import { describe, expect, it } from "vitest";
import { DIFFICULTIES, WEEKLY_DIFFICULTY_PATTERN } from "../../core/difficulty";
import { bearData, type BearData } from "./data";
import { buildBearRound, buildDailyBearRound, findDailyBearRound, pickDailyBears } from "./daily";
import { TIER_SETTINGS } from "./tiers";

const DAYS = Array.from({ length: 730 }, (_, day) => day);

describe("pickDailyBears", () => {
  it("follows the weekly pattern for the tier", () => {
    DAYS.slice(0, 28).forEach((day) => {
      expect(pickDailyBears(day).tier).toBe(WEEKLY_DIFFICULTY_PATTERN[day % 7]);
    });
  });

  it("picks a puzzle that exists in the pool of its tier", () => {
    DAYS.forEach((day) => {
      const { tier, poolIndex } = pickDailyBears(day);
      expect(bearData[tier][poolIndex]).toBeDefined();
    });
  });

  it("never repeats a puzzle in the first two years", () => {
    const keys = DAYS.map((day) => {
      const { tier, poolIndex } = pickDailyBears(day);
      return `${tier}:${poolIndex}`;
    });
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("uses the size of the data it is given", () => {
    const small: BearData = {
      easy: bearData.easy.slice(0, 1),
      medium: bearData.medium.slice(0, 2),
      hard: bearData.hard.slice(0, 3),
    };
    DAYS.slice(0, 100).forEach((day) => {
      const { tier, poolIndex } = pickDailyBears(day, small);
      expect(poolIndex).toBeLessThan(small[tier].length);
    });
  });
});

describe("buildBearRound", () => {
  it("decodes the puzzle with the size of its tier", () => {
    DIFFICULTIES.forEach((tier) => {
      const round = buildBearRound(tier, 3);
      expect(round.tier).toBe(tier);
      expect(round.poolIndex).toBe(3);
      expect(round.puzzle.size).toBe(TIER_SETTINGS[tier].size);
      expect(round.puzzle.bears).toHaveLength(TIER_SETTINGS[tier].bears);
    });
  });

  it("refuses a puzzle that is not in the pool", () => {
    expect(() => buildBearRound("easy", 9999)).toThrow("no easy Bear Sweeper number 9999");
    expect(() => buildBearRound("easy", -1)).toThrow();
  });
});

describe("buildDailyBearRound and findDailyBearRound", () => {
  it("build the puzzle that the daily pick names", () => {
    DAYS.slice(0, 20).forEach((day) => {
      const { tier, poolIndex } = pickDailyBears(day);
      const round = buildDailyBearRound(day);
      expect([round.tier, round.poolIndex]).toEqual([tier, poolIndex]);
      expect(findDailyBearRound(day)).toEqual(round);
    });
  });

  it("find nothing, instead of failing, when the data is empty", () => {
    expect(findDailyBearRound(0, { easy: [], medium: [], hard: [] })).toBeNull();
  });
});
