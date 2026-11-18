import { describe, expect, it } from "vitest";
import puzzleData from "./puzzles.json";
import { pickDailyTrailPuzzle } from "./daily";
import { TRAIL_TIERS, TRAIL_WEEKLY_PATTERN, type TrailTier } from "./tiers";

const pools = puzzleData as Record<TrailTier, string[]>;
const DAYS = Array.from({ length: 700 }, (_, day) => day);

describe("TRAIL_WEEKLY_PATTERN", () => {
  it("covers a week with medium and hard days only, and more medium days than hard", () => {
    expect(TRAIL_WEEKLY_PATTERN).toHaveLength(7);
    TRAIL_WEEKLY_PATTERN.forEach((tier) => expect(TRAIL_TIERS).toContain(tier));
    expect(TRAIL_WEEKLY_PATTERN.filter((tier) => tier === "medium")).toHaveLength(4);
    expect(TRAIL_WEEKLY_PATTERN.filter((tier) => tier === "hard")).toHaveLength(3);
  });

  it("never has two hard days in a row, and never ends the week and starts the next one hard", () => {
    TRAIL_WEEKLY_PATTERN.forEach((tier, index) => {
      const next = TRAIL_WEEKLY_PATTERN[(index + 1) % 7];
      expect(tier === "hard" && next === "hard").toBe(false);
    });
  });
});

describe("pickDailyTrailPuzzle", () => {
  it("follows the weekly pattern for the tier", () => {
    DAYS.slice(0, 28).forEach((day) => {
      expect(pickDailyTrailPuzzle(day).tier).toBe(TRAIL_WEEKLY_PATTERN[day % 7]);
    });
  });

  it("picks a puzzle from the pool of its tier", () => {
    DAYS.forEach((day) => {
      const { tier, code } = pickDailyTrailPuzzle(day);
      expect(pools[tier]).toContain(code);
    });
  });

  it("gives the same puzzle every time for the same day", () => {
    DAYS.slice(0, 50).forEach((day) => {
      expect(pickDailyTrailPuzzle(day)).toEqual(pickDailyTrailPuzzle(day));
    });
  });

  it("never repeats a puzzle across the first two years", () => {
    const codes = Array.from({ length: 730 }, (_, day) => pickDailyTrailPuzzle(day).code);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it("never repeats a letter set on consecutive days of the same tier", () => {
    const hard = Array.from({ length: 200 }, (_, day) => pickDailyTrailPuzzle(day)).filter(
      (pick) => pick.tier === "hard",
    );
    hard.slice(1).forEach((pick, index) => expect(pick.code).not.toBe(hard[index].code));
  });

  it("does not hand out the pool in its stored order", () => {
    const firstMedium = DAYS.filter((day) => TRAIL_WEEKLY_PATTERN[day % 7] === "medium")
      .slice(0, 10)
      .map((day) => pickDailyTrailPuzzle(day).code);
    expect(firstMedium).not.toEqual(pools.medium.slice(0, 10));
  });

  it("works for days before the launch", () => {
    [-1, -7, -8, -100].forEach((day) => {
      const { tier, code } = pickDailyTrailPuzzle(day);
      expect(pools[tier]).toContain(code);
    });
    expect(pickDailyTrailPuzzle(-1).tier).toBe(TRAIL_WEEKLY_PATTERN[6]);
  });

  it("keeps going after a pool has been used up, starting over", () => {
    const farFuture = 7 * 5000;
    const { tier, code } = pickDailyTrailPuzzle(farFuture);
    expect(pools[tier]).toContain(code);
  });

  it("uses every tier across a week", () => {
    const tiers = new Set(DAYS.slice(0, 7).map((day) => pickDailyTrailPuzzle(day).tier));
    expect(tiers).toEqual(new Set(["medium", "hard"]));
  });
});
