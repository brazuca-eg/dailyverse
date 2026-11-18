import { describe, expect, it } from "vitest";
import { DIFFICULTIES, WEEKLY_DIFFICULTY_PATTERN } from "../../core/difficulty";
import { switchbackData, type SwitchbackData } from "./data";
import {
  buildDailySwitchbackRound,
  buildSwitchbackRound,
  findDailySwitchbackRound,
  pickDailySwitchback,
} from "./daily";
import { countSolutions } from "./solver";
import { TIER_SETTINGS } from "./tiers";

const DAYS = Array.from({ length: 730 }, (_, day) => day);

describe("pickDailySwitchback", () => {
  it("follows the weekly pattern for the tier", () => {
    DAYS.slice(0, 28).forEach((day) => {
      expect(pickDailySwitchback(day).tier).toBe(WEEKLY_DIFFICULTY_PATTERN[day % 7]);
    });
  });

  it("picks a puzzle that exists in the pool of its tier", () => {
    DAYS.forEach((day) => {
      const { tier, poolIndex } = pickDailySwitchback(day);
      expect(switchbackData[tier][poolIndex]).toBeDefined();
    });
  });

  it("never repeats a puzzle in the first two years", () => {
    const keys = DAYS.map((day) => {
      const { tier, poolIndex } = pickDailySwitchback(day);
      return `${tier}:${poolIndex}`;
    });
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("does not use the same order as the other games' pools", () => {
    const own = DAYS.slice(0, 30).map((day) => pickDailySwitchback(day).poolIndex);
    expect(own).not.toEqual(Array.from({ length: 30 }, (_, index) => index));
  });

  it("uses the size of the data it is given", () => {
    const small: SwitchbackData = {
      easy: switchbackData.easy.slice(0, 1),
      medium: switchbackData.medium.slice(0, 2),
      hard: switchbackData.hard.slice(0, 3),
    };
    DAYS.slice(0, 100).forEach((day) => {
      const { tier, poolIndex } = pickDailySwitchback(day, small);
      expect(poolIndex).toBeLessThan(small[tier].length);
    });
  });
});

describe("buildSwitchbackRound", () => {
  it("decodes the puzzle and solves it", () => {
    DIFFICULTIES.forEach((tier) => {
      const round = buildSwitchbackRound(tier, 3);
      expect(round.tier).toBe(tier);
      expect(round.poolIndex).toBe(3);
      expect(round.puzzle.size).toBe(TIER_SETTINGS[tier].size);
      expect(countSolutions(round.puzzle, 2)).toBe(1);
      expect(round.solution).toHaveLength(round.puzzle.size ** 2);
    });
  });

  it("refuses a puzzle that is not in the pool", () => {
    expect(() => buildSwitchbackRound("easy", 9999)).toThrow("no easy Switchback number 9999");
    expect(() => buildSwitchbackRound("easy", -1)).toThrow();
  });

  it("refuses a puzzle that cannot be solved", () => {
    const broken: SwitchbackData = { ...switchbackData, easy: [{ m: [0, 1], w: [] }] };
    expect(() => buildSwitchbackRound("easy", 0, broken)).toThrow("has no solution");
  });
});

describe("buildDailySwitchbackRound and findDailySwitchbackRound", () => {
  it("build the puzzle that the daily pick names", () => {
    DAYS.slice(0, 20).forEach((day) => {
      const { tier, poolIndex } = pickDailySwitchback(day);
      const round = buildDailySwitchbackRound(day);
      expect([round.tier, round.poolIndex]).toEqual([tier, poolIndex]);
      expect(findDailySwitchbackRound(day)).toEqual(round);
    });
  });

  it("find nothing, instead of failing, when the data is broken", () => {
    const broken: SwitchbackData = { easy: [{ m: [0, 1], w: [] }], medium: [], hard: [] };
    expect(findDailySwitchbackRound(0, broken)).toBeNull();
  });

  it("is quick, because it runs in the browser", () => {
    const started = performance.now();
    DAYS.slice(0, 30).forEach((day) => buildDailySwitchbackRound(day));
    expect((performance.now() - started) / 30).toBeLessThan(50);
  });
});
