import { describe, expect, it } from "vitest";
import { verifyWeatherData } from "../../src/games/weather-window/verify";
import { SEED_BASES, buildWeatherData } from "./build";

const sizes = { easy: 3, medium: 3, hard: 2 };

describe("buildWeatherData", () => {
  const data = buildWeatherData(sizes);

  it("builds the wanted number of puzzles for each tier", () => {
    expect(data.easy).toHaveLength(3);
    expect(data.medium).toHaveLength(3);
    expect(data.hard).toHaveLength(2);
  });

  it("makes puzzles that pass the verifier, apart from pool size", () => {
    const issues = verifyWeatherData(data).filter((issue) => !/only \d+ puzzles/.test(issue));
    expect(issues).toEqual([]);
  });

  it("is the same every time and never repeats a puzzle", () => {
    expect(buildWeatherData(sizes)).toEqual(data);
    const bigger = buildWeatherData({ easy: 60, medium: 3, hard: 2 });
    expect(new Set(bigger.easy.map((puzzle) => JSON.stringify(puzzle))).size).toBe(60);
  });

  it("uses its own seeds for each tier", () => {
    expect(new Set(Object.values(SEED_BASES)).size).toBe(3);
  });

  it("starts with the same puzzles when the pool is made bigger", () => {
    const bigger = buildWeatherData({ easy: 4, medium: 3, hard: 2 });
    expect(bigger.easy.slice(0, 3)).toEqual(data.easy);
  });
});
