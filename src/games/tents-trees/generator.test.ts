import { describe, expect, it } from "vitest";
import { DIFFICULTIES } from "../../core/difficulty";
import { solveByLogic } from "./deduce";
import { TIER_SETTINGS } from "./difficulty";
import { generateTentsPuzzle } from "./generator";
import { isValidSolution, toIndex } from "./rules";
import { solve } from "./solver";

const SEEDS = Array.from({ length: 40 }, (_, seed) => seed);

function sum(values: readonly number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

describe("generateTentsPuzzle", () => {
  it("makes the grid size of the tier", () => {
    DIFFICULTIES.forEach((tier) => {
      expect(generateTentsPuzzle(3, tier).size).toBe(TIER_SETTINGS[tier].size);
    });
  });

  it("makes the same puzzle every time for the same seed and tier", () => {
    DIFFICULTIES.forEach((tier) => {
      expect(generateTentsPuzzle(11, tier)).toEqual(generateTentsPuzzle(11, tier));
    });
  });

  it("makes different puzzles for different seeds", () => {
    DIFFICULTIES.forEach((tier) => {
      const puzzles = SEEDS.map((seed) => JSON.stringify(generateTentsPuzzle(seed, tier)));
      expect(new Set(puzzles).size).toBe(SEEDS.length);
    });
  });

  it("makes a different puzzle for each tier from the same seed", () => {
    const puzzles = DIFFICULTIES.map((tier) => generateTentsPuzzle(5, tier).size);
    expect(new Set(puzzles).size).toBe(3);
  });

  it("has as many tents as trees, and counts that add up", () => {
    DIFFICULTIES.forEach((tier) => {
      SEEDS.forEach((seed) => {
        const puzzle = generateTentsPuzzle(seed, tier);
        expect(puzzle.solution).toHaveLength(puzzle.trees.length);
        expect(sum(puzzle.rowCounts)).toBe(puzzle.trees.length);
        expect(sum(puzzle.colCounts)).toBe(puzzle.trees.length);
        expect(puzzle.rowCounts).toHaveLength(puzzle.size);
        expect(puzzle.colCounts).toHaveLength(puzzle.size);
      });
    });
  });

  it("has a stored solution that follows every rule", () => {
    DIFFICULTIES.forEach((tier) => {
      SEEDS.forEach((seed) => {
        const puzzle = generateTentsPuzzle(seed, tier);
        expect(isValidSolution(puzzle, puzzle.solution)).toBe(true);
      });
    });
  });

  it("has exactly one solution, and it is the stored one", () => {
    DIFFICULTIES.forEach((tier) => {
      SEEDS.forEach((seed) => {
        const puzzle = generateTentsPuzzle(seed, tier);
        const result = solve(puzzle, 2);
        expect(result.count).toBe(1);
        expect(result.solutions[0]).toEqual(puzzle.solution);
      });
    });
  });

  it("can be solved by logic alone, with the amount of lookahead the tier asks for", () => {
    DIFFICULTIES.forEach((tier) => {
      const { minLookaheads, maxLookaheads } = TIER_SETTINGS[tier];
      SEEDS.forEach((seed) => {
        const logic = solveByLogic(generateTentsPuzzle(seed, tier));
        expect(logic.solved).toBe(true);
        expect(logic.lookaheads).toBeGreaterThanOrEqual(minLookaheads);
        expect(logic.lookaheads).toBeLessThanOrEqual(maxLookaheads);
      });
    });
  });

  it("puts trees and tents on separate squares, inside the grid", () => {
    SEEDS.forEach((seed) => {
      const puzzle = generateTentsPuzzle(seed, "medium");
      const treeIndexes = puzzle.trees.map((tree) => toIndex(puzzle.size, tree));
      expect(new Set(treeIndexes).size).toBe(treeIndexes.length);
      puzzle.solution.forEach((tent) => {
        expect(treeIndexes).not.toContain(toIndex(puzzle.size, tent));
      });
      [...puzzle.trees, ...puzzle.solution].forEach((cell) => {
        expect(cell.row).toBeGreaterThanOrEqual(0);
        expect(cell.row).toBeLessThan(puzzle.size);
        expect(cell.col).toBeGreaterThanOrEqual(0);
        expect(cell.col).toBeLessThan(puzzle.size);
      });
    });
  });

  it("lists trees and tents row by row", () => {
    const puzzle = generateTentsPuzzle(2, "hard");
    [puzzle.trees, puzzle.solution].forEach((cells) => {
      cells.slice(1).forEach((cell, index) => {
        const previous = cells[index];
        expect(
          cell.row > previous.row || (cell.row === previous.row && cell.col > previous.col),
        ).toBe(true);
      });
    });
  });

  it("is quick enough to run in the browser when the page opens", () => {
    DIFFICULTIES.forEach((tier) => {
      const started = performance.now();
      SEEDS.slice(0, 10).forEach((seed) => generateTentsPuzzle(seed, tier));
      expect((performance.now() - started) / 10).toBeLessThan(250);
    });
  });
});
