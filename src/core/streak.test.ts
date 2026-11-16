import { describe, expect, it } from "vitest";
import {
  applyGameResult,
  calculateActiveStreak,
  calculateWinRatePercent,
  createEmptyStats,
  isGameStats,
} from "./streak";

describe("applyGameResult", () => {
  it("starts a streak on the first win", () => {
    expect(applyGameResult(createEmptyStats(), 10, true)).toEqual({
      gamesPlayed: 1,
      gamesWon: 1,
      currentStreak: 1,
      maxStreak: 1,
      lastCompletedDay: 10,
    });
  });

  it("extends the streak on consecutive days", () => {
    const day1 = applyGameResult(createEmptyStats(), 10, true);
    const day2 = applyGameResult(day1, 11, true);
    expect(day2.currentStreak).toBe(2);
    expect(day2.maxStreak).toBe(2);
  });

  it("restarts the streak at 1 after a missed day", () => {
    const day1 = applyGameResult(applyGameResult(createEmptyStats(), 10, true), 11, true);
    const afterGap = applyGameResult(day1, 13, true);
    expect(afterGap.currentStreak).toBe(1);
    expect(afterGap.maxStreak).toBe(2);
  });

  it("resets the streak to 0 on a loss but keeps the max", () => {
    const won = applyGameResult(applyGameResult(createEmptyStats(), 10, true), 11, true);
    const lost = applyGameResult(won, 12, false);
    expect(lost.currentStreak).toBe(0);
    expect(lost.maxStreak).toBe(2);
    expect(lost.gamesPlayed).toBe(3);
    expect(lost.gamesWon).toBe(2);
  });

  it("starts a new streak of 1 when winning right after a loss", () => {
    const lost = applyGameResult(createEmptyStats(), 10, false);
    expect(applyGameResult(lost, 11, true).currentStreak).toBe(1);
  });

  it("ignores a second result for the same day", () => {
    const first = applyGameResult(createEmptyStats(), 10, true);
    expect(applyGameResult(first, 10, false)).toBe(first);
  });
});

describe("calculateActiveStreak", () => {
  const stats = applyGameResult(createEmptyStats(), 10, true);

  it("keeps the streak alive on the same or the next day", () => {
    expect(calculateActiveStreak(stats, 10)).toBe(1);
    expect(calculateActiveStreak(stats, 11)).toBe(1);
  });

  it("drops the streak after a missed day", () => {
    expect(calculateActiveStreak(stats, 12)).toBe(0);
  });

  it("is 0 for brand new stats", () => {
    expect(calculateActiveStreak(createEmptyStats(), 5)).toBe(0);
  });
});

describe("calculateWinRatePercent", () => {
  it("is 0 with no games", () => {
    expect(calculateWinRatePercent(createEmptyStats())).toBe(0);
  });

  it("rounds to a whole percent", () => {
    const stats = { ...createEmptyStats(), gamesPlayed: 3, gamesWon: 2 };
    expect(calculateWinRatePercent(stats)).toBe(67);
  });
});

describe("isGameStats", () => {
  it("accepts valid stats and rejects malformed ones", () => {
    expect(isGameStats(createEmptyStats())).toBe(true);
    expect(isGameStats({ ...createEmptyStats(), gamesPlayed: -1 })).toBe(false);
    expect(isGameStats({ ...createEmptyStats(), lastCompletedDay: "x" })).toBe(false);
    expect(isGameStats(null)).toBe(false);
    expect(isGameStats({})).toBe(false);
  });
});
