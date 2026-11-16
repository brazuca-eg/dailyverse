import { describe, expect, it } from "vitest";
import { WEEKLY_DIFFICULTY_PATTERN } from "../../core/difficulty";
import { buildDailyRound, findDailyRound, pickDailyTentsSpec } from "./daily";
import { TIER_SETTINGS } from "./difficulty";

const DAYS = Array.from({ length: 21 }, (_, day) => day);

describe("pickDailyTentsSpec", () => {
  it("follows the weekly easy, medium and hard pattern", () => {
    DAYS.forEach((day) => {
      expect(pickDailyTentsSpec(day).tier).toBe(
        WEEKLY_DIFFICULTY_PATTERN[day % WEEKLY_DIFFICULTY_PATTERN.length],
      );
    });
  });

  it("gives every day its own seed, apart from the other games", () => {
    const seeds = DAYS.map((day) => pickDailyTentsSpec(day).seed);
    expect(new Set(seeds).size).toBe(DAYS.length);
    expect(pickDailyTentsSpec(0).seed).toBe(2000);
  });
});

describe("buildDailyRound", () => {
  it("builds the puzzle for the day's seed and tier", () => {
    const round = buildDailyRound(4);
    const { seed, tier } = pickDailyTentsSpec(4);
    expect(round.seed).toBe(seed);
    expect(round.tier).toBe(tier);
    expect(round.puzzle.size).toBe(TIER_SETTINGS[tier].size);
  });

  it("builds the same round every time for the same day", () => {
    expect(buildDailyRound(9)).toEqual(buildDailyRound(9));
  });

  it("gives every day a different puzzle", () => {
    const puzzles = DAYS.map((day) => JSON.stringify(buildDailyRound(day).puzzle));
    expect(new Set(puzzles).size).toBe(DAYS.length);
  });

  it("works for days before the launch", () => {
    expect(buildDailyRound(-3).puzzle.trees.length).toBeGreaterThan(0);
  });
});

describe("findDailyRound", () => {
  it("finds the same round as buildDailyRound", () => {
    expect(findDailyRound(6)).toEqual(buildDailyRound(6));
  });
});
