import { describe, expect, it } from "vitest";
import { solveByLogic } from "./deduce";
import { generateTentsPuzzle } from "./generator";
import { isValidSolution } from "./rules";
import type { Cell, TentsClues } from "./types";

const forced: TentsClues = {
  size: 2,
  trees: [{ row: 0, col: 0 }],
  rowCounts: [0, 1],
  colCounts: [1, 0],
};

const ambiguous: TentsClues = {
  size: 3,
  trees: [
    { row: 1, col: 0 },
    { row: 1, col: 2 },
  ],
  rowCounts: [1, 0, 1],
  colCounts: [1, 0, 1],
};

const impossible: TentsClues = {
  size: 2,
  trees: [{ row: 0, col: 0 }],
  rowCounts: [1, 0],
  colCounts: [1, 0],
};

describe("solveByLogic", () => {
  it("solves a forced puzzle with plain rules and no lookahead", () => {
    const result = solveByLogic(forced);
    expect(result.solved).toBe(true);
    expect(result.lookaheads).toBe(0);
    expect(result.tents).toEqual([{ row: 1, col: 0 }]);
  });

  it("does not guess when there are two solutions", () => {
    const result = solveByLogic(ambiguous);
    expect(result.solved).toBe(false);
    expect(result.tents).toEqual([]);
  });

  it("gives up cleanly on a puzzle that contradicts itself", () => {
    expect(solveByLogic(impossible).solved).toBe(false);
  });

  it("needs no lookahead for an easy puzzle", () => {
    const puzzle = generateTentsPuzzle(1, "easy");
    expect(solveByLogic(puzzle).lookaheads).toBe(0);
  });

  it("needs lookahead for a medium and a hard puzzle", () => {
    expect(solveByLogic(generateTentsPuzzle(1, "medium")).lookaheads).toBeGreaterThanOrEqual(1);
    expect(solveByLogic(generateTentsPuzzle(1, "hard")).lookaheads).toBeGreaterThanOrEqual(3);
  });

  it("reaches the same tents the puzzle was made from", () => {
    ["easy", "medium", "hard"].forEach((tier) => {
      const puzzle = generateTentsPuzzle(4, tier as "easy" | "medium" | "hard");
      const result = solveByLogic(puzzle);
      expect(result.solved).toBe(true);
      expect(result.tents).toEqual(puzzle.solution);
      expect(isValidSolution(puzzle, result.tents)).toBe(true);
    });
  });

  it("gives the same answer every time", () => {
    const puzzle = generateTentsPuzzle(9, "medium");
    expect(solveByLogic(puzzle)).toEqual(solveByLogic(puzzle));
  });
});

function fromPairs(
  size: number,
  trees: readonly (readonly [number, number])[],
  rowCounts: readonly number[],
  colCounts: readonly number[],
): TentsClues {
  const cells: Cell[] = trees.map(([row, col]) => ({ row, col }));
  return { size, trees: cells, rowCounts, colCounts };
}

describe("solveByLogic rules", () => {
  it("rules out a square that touches every spot a tree's tent could be in", () => {
    const puzzle = fromPairs(
      6,
      [
        [1, 4],
        [2, 1],
        [3, 2],
        [3, 5],
        [4, 0],
        [4, 3],
        [5, 3],
      ],
      [1, 1, 1, 1, 1, 2],
      [1, 2, 1, 0, 2, 1],
    );
    const result = solveByLogic(puzzle);
    expect(result.solved).toBe(true);
    expect(result.lookaheads).toBe(0);
  });

  it("puts a tent where a tree has only one place left for it", () => {
    const puzzle = fromPairs(
      6,
      [
        [0, 0],
        [0, 4],
        [2, 3],
        [3, 4],
        [4, 1],
        [4, 3],
        [4, 5],
      ],
      [2, 0, 0, 2, 0, 3],
      [0, 2, 0, 3, 0, 2],
    );
    const result = solveByLogic(puzzle);
    expect(result.solved).toBe(true);
    expect(result.lookaheads).toBe(0);
  });
});
