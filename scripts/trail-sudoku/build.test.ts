import { describe, expect, it } from "vitest";
import { verifySudokuData } from "../../src/games/trail-sudoku/verify";
import { SEED_BASES, buildSudokuData } from "./build";

const sizes = { easy: 3, medium: 3, hard: 2 };

describe("buildSudokuData", () => {
  const data = buildSudokuData(sizes);

  it("builds the wanted number of puzzles for each tier, as grids of digits", () => {
    expect(data.easy).toHaveLength(3);
    expect(data.medium).toHaveLength(3);
    expect(data.hard).toHaveLength(2);
    data.easy.forEach((text) => expect(text).toMatch(/^[0-6]{36}$/));
    data.hard.forEach((text) => expect(text).toMatch(/^[0-9]{81}$/));
  });

  it("makes puzzles that pass the verifier, apart from pool size", () => {
    const issues = verifySudokuData(data).filter((issue) => !/only \d+ puzzles/.test(issue));
    expect(issues).toEqual([]);
  });

  it("is the same every time, and does not repeat a puzzle", () => {
    expect(buildSudokuData(sizes)).toEqual(data);
    expect(new Set(data.easy).size).toBe(3);
    expect(new Set(data.medium).size).toBe(3);
  });

  it("uses its own seeds for each tier", () => {
    expect(new Set(Object.values(SEED_BASES)).size).toBe(3);
    expect(data.easy[0]).not.toBe(data.medium[0]);
  });

  it("starts with the same puzzles when the pool is made bigger", () => {
    const bigger = buildSudokuData({ easy: 4, medium: 3, hard: 2 });
    expect(bigger.easy.slice(0, 3)).toEqual(data.easy);
  });
});
