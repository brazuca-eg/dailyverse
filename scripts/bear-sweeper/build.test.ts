import { describe, expect, it } from "vitest";
import { verifyBearData } from "../../src/games/bear-sweeper/verify";
import { SEED_BASES, buildBearData } from "./build";

const sizes = { easy: 3, medium: 3, hard: 2 };

describe("buildBearData", () => {
  const data = buildBearData(sizes);

  it("builds the wanted number of puzzles for each tier", () => {
    expect(data.easy).toHaveLength(3);
    expect(data.medium).toHaveLength(3);
    expect(data.hard).toHaveLength(2);
  });

  it("makes puzzles that pass the verifier, apart from pool size", () => {
    const issues = verifyBearData(data).filter((issue) => !/only \d+ puzzles/.test(issue));
    expect(issues).toEqual([]);
  });

  it("is the same every time and does not repeat a puzzle", () => {
    expect(buildBearData(sizes)).toEqual(data);
    expect(new Set(data.easy.map((puzzle) => JSON.stringify(puzzle))).size).toBe(3);
    expect(new Set(data.medium.map((puzzle) => JSON.stringify(puzzle))).size).toBe(3);
  });

  it("uses its own seeds for each tier", () => {
    expect(new Set(Object.values(SEED_BASES)).size).toBe(3);
  });

  it("starts with the same puzzles when the pool is made bigger", () => {
    const bigger = buildBearData({ easy: 4, medium: 3, hard: 2 });
    expect(bigger.easy.slice(0, 3)).toEqual(data.easy);
  });
});
