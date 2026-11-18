import { describe, expect, it } from "vitest";
import { DIFFICULTIES } from "../../core/difficulty";
import { generateWeatherPuzzle, isPuzzleAcceptable } from "./generator";
import { CONFLICT, OBVIOUS } from "./fixtures";
import { analysePuzzle } from "./solver";
import { MAX_BLIND_SHARE, MIN_DISTINCT_WEATHERS, TIER_SETTINGS } from "./tiers";

const SEEDS = Array.from({ length: 12 }, (_, index) => 500 + index);

describe("generateWeatherPuzzle", () => {
  it("makes the same puzzle for the same seed and a different one for another", () => {
    DIFFICULTIES.forEach((tier) => {
      expect(generateWeatherPuzzle(5, tier)).toEqual(generateWeatherPuzzle(5, tier));
    });
    expect(generateWeatherPuzzle(5, "hard")).not.toEqual(generateWeatherPuzzle(6, "hard"));
  });

  it("uses the days and trips of the tier, each trip once", () => {
    DIFFICULTIES.forEach((tier) => {
      SEEDS.forEach((seed) => {
        const puzzle = generateWeatherPuzzle(seed, tier);
        expect(puzzle.weather).toHaveLength(TIER_SETTINGS[tier].days);
        expect(puzzle.trips).toHaveLength(TIER_SETTINGS[tier].trips);
        expect(new Set(puzzle.trips).size).toBe(puzzle.trips.length);
      });
    });
  });

  it("only makes puzzles with a clear best plan that needs memory", () => {
    DIFFICULTIES.forEach((tier) => {
      SEEDS.forEach((seed) => {
        const puzzle = generateWeatherPuzzle(seed, tier);
        const analysis = analysePuzzle(puzzle);
        expect(analysis.best - analysis.rival).toBeGreaterThanOrEqual(2);
        expect(analysis.averageShare).toBeLessThanOrEqual(MAX_BLIND_SHARE);
        expect(new Set(puzzle.weather).size).toBeGreaterThanOrEqual(MIN_DISTINCT_WEATHERS);
      });
    });
  });

  it("makes medium and hard puzzles where choosing trip by trip is not enough", () => {
    (["medium", "hard"] as const).forEach((tier) => {
      SEEDS.forEach((seed) => {
        const analysis = analysePuzzle(generateWeatherPuzzle(seed, tier));
        expect(analysis.greedy).toBeLessThan(analysis.best);
      });
    });
  });
});

describe("isPuzzleAcceptable", () => {
  const easy = TIER_SETTINGS.easy;

  it("rejects a puzzle with too few kinds of weather", () => {
    expect(isPuzzleAcceptable({ weather: [0, 0, 0, 4, 4], trips: [0, 4] }, easy)).toBe(false);
  });

  it("rejects a puzzle whose best plan is not clearly ahead", () => {
    const tied = { weather: [0, 1, 2, 3, 4], trips: [0, 1] };
    const analysis = analysePuzzle(tied);
    expect(analysis.best - analysis.rival).toBeLessThan(2);
    expect(isPuzzleAcceptable(tied, easy)).toBe(false);
  });

  it("rejects a puzzle where even the best plan is poor", () => {
    expect(isPuzzleAcceptable({ weather: [2, 3, 2, 3, 4], trips: [0, 1] }, easy)).toBe(false);
  });

  it("rejects a puzzle that is otherwise fine but where even the best plan is poor", () => {
    const gloomy = { weather: [3, 3, 3, 3, 3, 2, 1], trips: [0, 1, 2] };
    const analysis = analysePuzzle(gloomy);
    expect(analysis.best - analysis.rival).toBeGreaterThanOrEqual(2);
    expect(analysis.averageShare).toBeLessThanOrEqual(MAX_BLIND_SHARE);
    expect(analysis.greedy).toBeLessThan(analysis.best);
    expect(isPuzzleAcceptable(gloomy, TIER_SETTINGS.medium)).toBe(false);
  });

  it("rejects a puzzle that a blind plan would do too well on", () => {
    const generous = { weather: [0, 1, 0, 1, 0], trips: [0, 1] };
    expect(analysePuzzle(generous).averageShare).toBeGreaterThan(MAX_BLIND_SHARE);
    expect(isPuzzleAcceptable(generous, easy)).toBe(false);
  });

  it("asks for a conflict only where the tier needs one", () => {
    const sample = generateWeatherPuzzle(1, "medium");
    const noConflict = { ...TIER_SETTINGS.medium, needsConflict: false };
    expect(isPuzzleAcceptable(sample, noConflict)).toBe(true);
    const relaxedFixture = { ...TIER_SETTINGS.easy, needsConflict: true };
    expect(analysePuzzle(OBVIOUS).greedy).toBe(analysePuzzle(OBVIOUS).best);
    expect(isPuzzleAcceptable(OBVIOUS, relaxedFixture)).toBe(false);
    expect(analysePuzzle(CONFLICT).greedy).toBeLessThan(analysePuzzle(CONFLICT).best);
  });
});
