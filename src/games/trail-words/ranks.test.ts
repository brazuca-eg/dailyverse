import { describe, expect, it } from "vitest";
import { calculateThreshold, findRankProgress, hasReachedWinRank, RANKS, WIN_RANK } from "./ranks";

describe("RANKS", () => {
  it("climb from zero to Summit, with each share higher than the last", () => {
    expect(RANKS[0]).toEqual({ name: "Beginner", share: 0 });
    expect(RANKS[RANKS.length - 1].name).toBe("Summit");
    RANKS.slice(1).forEach((rank, index) => expect(rank.share).toBeGreaterThan(RANKS[index].share));
  });

  it("wins at Ranger, which is half the points", () => {
    expect(WIN_RANK).toBe("Ranger");
    expect(RANKS.find((rank) => rank.name === "Ranger")?.share).toBe(0.5);
  });
});

describe("calculateThreshold", () => {
  it("rounds up to whole points", () => {
    expect(calculateThreshold({ name: "x", share: 0.5 }, 101)).toBe(51);
    expect(calculateThreshold({ name: "x", share: 0.7 }, 100)).toBe(70);
    expect(calculateThreshold({ name: "x", share: 0 }, 100)).toBe(0);
  });
});

describe("findRankProgress", () => {
  it("starts as Beginner, with the Hiker threshold as the next goal", () => {
    expect(findRankProgress(0, 100)).toEqual({
      rank: "Beginner",
      next: "Hiker",
      pointsToNext: 15,
      threshold: 0,
    });
  });

  it("moves up exactly at each threshold", () => {
    expect(findRankProgress(14, 100).rank).toBe("Beginner");
    expect(findRankProgress(15, 100).rank).toBe("Hiker");
    expect(findRankProgress(29, 100).rank).toBe("Hiker");
    expect(findRankProgress(30, 100).rank).toBe("Trekker");
    expect(findRankProgress(49, 100).rank).toBe("Trekker");
    expect(findRankProgress(50, 100).rank).toBe("Ranger");
    expect(findRankProgress(69, 100).rank).toBe("Ranger");
    expect(findRankProgress(70, 100).rank).toBe("Summit");
  });

  it("says how many points are left to the next rank", () => {
    expect(findRankProgress(40, 100)).toEqual({
      rank: "Trekker",
      next: "Ranger",
      pointsToNext: 10,
      threshold: 30,
    });
  });

  it("has no next rank at the top, and stays there above the maximum", () => {
    expect(findRankProgress(70, 100)).toEqual({
      rank: "Summit",
      next: null,
      pointsToNext: 0,
      threshold: 70,
    });
    expect(findRankProgress(500, 100).rank).toBe("Summit");
  });

  it("copes with a puzzle worth no points", () => {
    expect(findRankProgress(0, 0).rank).toBe("Summit");
  });
});

describe("hasReachedWinRank", () => {
  it("is true from half the points, and false below", () => {
    expect(hasReachedWinRank(49, 100)).toBe(false);
    expect(hasReachedWinRank(50, 100)).toBe(true);
    expect(hasReachedWinRank(100, 100)).toBe(true);
  });

  it("is never true for a puzzle worth no points", () => {
    expect(hasReachedWinRank(0, 0)).toBe(false);
  });
});
