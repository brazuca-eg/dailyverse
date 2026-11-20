import { describe, expect, it } from "vitest";
import type { PlayRecord } from "./history";
import {
  buildDayCells,
  calculateBestStreak,
  calculateCurrentStreak,
  summarise,
  summariseByGame,
  toDateText,
  toDayNumber,
} from "./overview";

function play(date: string, game = "a", score = 3, won = true): PlayRecord {
  return { game, date, score, maxScore: 5, won };
}

describe("day numbers", () => {
  it("count UTC days and convert back", () => {
    expect(toDayNumber("2026-11-21") - toDayNumber("2026-11-20")).toBe(1);
    expect(toDateText(toDayNumber("2026-03-01"))).toBe("2026-03-01");
    expect(toDayNumber("2026-03-01") - toDayNumber("2026-02-28")).toBe(1);
  });
});

describe("calculateCurrentStreak", () => {
  it("is zero without any play", () => {
    expect(calculateCurrentStreak([], "2026-11-20")).toBe(0);
  });

  it("counts consecutive days ending today", () => {
    const history = [play("2026-11-18"), play("2026-11-19"), play("2026-11-20")];
    expect(calculateCurrentStreak(history, "2026-11-20")).toBe(3);
  });

  it("stays alive until the end of the next day", () => {
    const history = [play("2026-11-18"), play("2026-11-19")];
    expect(calculateCurrentStreak(history, "2026-11-20")).toBe(2);
  });

  it("is gone after a missed day", () => {
    expect(calculateCurrentStreak([play("2026-11-17")], "2026-11-20")).toBe(0);
  });

  it("stops at a gap", () => {
    const history = [
      play("2026-11-15"),
      play("2026-11-16"),
      play("2026-11-19"),
      play("2026-11-20"),
    ];
    expect(calculateCurrentStreak(history, "2026-11-20")).toBe(2);
  });

  it("counts several games on one day as one day", () => {
    const history = [play("2026-11-20", "a"), play("2026-11-20", "b"), play("2026-11-19", "a")];
    expect(calculateCurrentStreak(history, "2026-11-20")).toBe(2);
  });

  it("works across a month change", () => {
    const history = [play("2026-10-31"), play("2026-11-01")];
    expect(calculateCurrentStreak(history, "2026-11-01")).toBe(2);
  });
});

describe("calculateBestStreak", () => {
  it("is zero without any play", () => {
    expect(calculateBestStreak([])).toBe(0);
  });

  it("finds the longest run, wherever it is", () => {
    const history = [
      play("2026-11-01"),
      play("2026-11-02"),
      play("2026-11-05"),
      play("2026-11-06"),
      play("2026-11-07"),
      play("2026-11-09"),
    ];
    expect(calculateBestStreak(history)).toBe(3);
  });

  it("does not depend on the order of the records", () => {
    const history = [play("2026-11-03"), play("2026-11-01"), play("2026-11-02")];
    expect(calculateBestStreak(history)).toBe(3);
  });

  it("counts one day as a streak of one", () => {
    expect(calculateBestStreak([play("2026-11-01"), play("2026-11-01", "b")])).toBe(1);
  });
});

describe("summarise", () => {
  it("is all zero without any play", () => {
    expect(summarise([], "2026-11-20")).toEqual({
      played: 0,
      wins: 0,
      winRate: 0,
      totalPoints: 0,
      averageScore: 0,
      currentStreak: 0,
      bestStreak: 0,
      playedToday: 0,
    });
  });

  it("adds up points, games, wins and today's games", () => {
    const history = [
      play("2026-11-19", "a", 5, true),
      play("2026-11-20", "a", 4, true),
      play("2026-11-20", "b", 0, false),
    ];
    expect(summarise(history, "2026-11-20")).toEqual({
      played: 3,
      wins: 2,
      winRate: 67,
      totalPoints: 9,
      averageScore: 3,
      currentStreak: 2,
      bestStreak: 2,
      playedToday: 2,
    });
  });

  it("rounds the average to one decimal", () => {
    const history = [
      play("2026-11-18", "a", 5),
      play("2026-11-19", "a", 4),
      play("2026-11-20", "a", 4),
    ];
    expect(summarise(history, "2026-11-20").averageScore).toBe(4.3);
  });
});

describe("summariseByGame", () => {
  it("totals each game on its own", () => {
    const totals = summariseByGame([
      play("2026-11-19", "a", 5, true),
      play("2026-11-20", "a", 1, false),
      play("2026-11-20", "b", 3, true),
    ]);
    expect(totals.get("a")).toEqual({ played: 2, wins: 1, points: 6 });
    expect(totals.get("b")).toEqual({ played: 1, wins: 1, points: 3 });
    expect(totals.get("c")).toBeUndefined();
  });
});

describe("buildDayCells", () => {
  it("lists the last days, oldest first, ending today", () => {
    const cells = buildDayCells([], "2026-11-20", 3);
    expect(cells.map((cell) => cell.date)).toEqual(["2026-11-18", "2026-11-19", "2026-11-20"]);
  });

  it("counts games and points on each day", () => {
    const history = [
      play("2026-11-19", "a", 5),
      play("2026-11-19", "b", 2),
      play("2026-11-10", "a", 4),
    ];
    const cells = buildDayCells(history, "2026-11-20", 3);
    expect(cells.map((cell) => [cell.count, cell.points])).toEqual([
      [0, 0],
      [2, 7],
      [0, 0],
    ]);
  });
});
