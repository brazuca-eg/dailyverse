import { describe, expect, it } from "vitest";
import { isValidSolution } from "./rules";
import { solve } from "./solver";
import type { TentsClues } from "./types";

const symmetric: TentsClues = {
  size: 3,
  trees: [
    { row: 1, col: 0 },
    { row: 1, col: 2 },
  ],
  rowCounts: [1, 0, 1],
  colCounts: [1, 0, 1],
};

const forced: TentsClues = {
  size: 2,
  trees: [{ row: 0, col: 0 }],
  rowCounts: [0, 1],
  colCounts: [1, 0],
};

const impossible: TentsClues = {
  size: 2,
  trees: [{ row: 0, col: 0 }],
  rowCounts: [1, 0],
  colCounts: [1, 0],
};

describe("solve", () => {
  it("finds the one solution of a forced puzzle", () => {
    const result = solve(forced);
    expect(result.count).toBe(1);
    expect(result.solutions).toEqual([[{ row: 1, col: 0 }]]);
  });

  it("finds both solutions of an ambiguous puzzle", () => {
    const result = solve(symmetric);
    expect(result.count).toBe(2);
    expect(result.solutions).toContainEqual([
      { row: 0, col: 0 },
      { row: 2, col: 2 },
    ]);
    expect(result.solutions).toContainEqual([
      { row: 0, col: 2 },
      { row: 2, col: 0 },
    ]);
  });

  it("finds nothing for a puzzle that cannot be solved", () => {
    expect(solve(impossible)).toEqual({ count: 0, solutions: [] });
  });

  it("stops at the limit it is given", () => {
    expect(solve(symmetric, 1).count).toBe(1);
    expect(solve(symmetric, 5).count).toBe(2);
  });

  it("only returns layouts that follow every rule", () => {
    solve(symmetric, 5).solutions.forEach((tents) => {
      expect(isValidSolution(symmetric, tents)).toBe(true);
    });
  });

  it("returns each distinct layout once", () => {
    const keys = solve(symmetric, 5).solutions.map((tents) => JSON.stringify(tents));
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("finds nothing when the counts do not add up to the number of trees", () => {
    expect(solve({ ...forced, rowCounts: [0, 2] }).count).toBe(0);
    expect(solve({ ...forced, rowCounts: [0, 0], colCounts: [0, 0] }).count).toBe(0);
  });

  it("finds nothing when a tree has no room for a tent", () => {
    const crowded: TentsClues = {
      size: 2,
      trees: [
        { row: 0, col: 0 },
        { row: 0, col: 1 },
        { row: 1, col: 0 },
        { row: 1, col: 1 },
      ],
      rowCounts: [2, 2],
      colCounts: [2, 2],
    };
    expect(solve(crowded).count).toBe(0);
  });

  it("does not need the trees in any order", () => {
    const reversed = { ...symmetric, trees: [...symmetric.trees].reverse() };
    expect(solve(reversed).count).toBe(2);
  });
});
