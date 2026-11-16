import { describe, expect, it } from "vitest";
import { WEEKLY_DIFFICULTY_PATTERN } from "../../core/difficulty";
import { buildDailyPuzzle, findDailyPuzzle, pickDailyPuzzleSpec } from "./daily";
import { buildPuzzleId } from "./game";

const DAYS = Array.from({ length: 28 }, (_, day) => day);

describe("pickDailyPuzzleSpec", () => {
  it("follows the weekly easy, medium and hard pattern", () => {
    DAYS.forEach((day) => {
      expect(pickDailyPuzzleSpec(day).tier).toBe(
        WEEKLY_DIFFICULTY_PATTERN[day % WEEKLY_DIFFICULTY_PATTERN.length],
      );
    });
  });

  it("gives every day its own seed", () => {
    const seeds = DAYS.map((day) => pickDailyPuzzleSpec(day).seed);
    expect(new Set(seeds).size).toBe(DAYS.length);
  });

  it("is the same every time for the same day", () => {
    expect(pickDailyPuzzleSpec(12)).toEqual(pickDailyPuzzleSpec(12));
  });

  it("still gives a valid pick for days before the launch", () => {
    [-1, -7, -8].forEach((day) => {
      const { tier } = pickDailyPuzzleSpec(day);
      expect(["easy", "medium", "hard"]).toContain(tier);
    });
    expect(pickDailyPuzzleSpec(-1).tier).toBe(WEEKLY_DIFFICULTY_PATTERN[6]);
  });
});

describe("buildDailyPuzzle", () => {
  it("builds the puzzle for the day's seed and tier, with five differences", () => {
    const puzzle = buildDailyPuzzle(3);
    const { seed, tier } = pickDailyPuzzleSpec(3);
    expect(puzzle.seed).toBe(seed);
    expect(puzzle.tier).toBe(tier);
    expect(puzzle.differences).toHaveLength(5);
  });

  it("builds the same puzzle every time for the same day", () => {
    expect(buildDailyPuzzle(9)).toEqual(buildDailyPuzzle(9));
  });

  it("gives every day a different puzzle with its own id", () => {
    const ids = DAYS.map((day) => buildPuzzleId(buildDailyPuzzle(day)));
    expect(new Set(ids).size).toBe(DAYS.length);
  });
});

describe("findDailyPuzzle", () => {
  it("finds the same puzzle as buildDailyPuzzle", () => {
    expect(findDailyPuzzle(6)).toEqual(buildDailyPuzzle(6));
  });
});
