import { describe, expect, it } from "vitest";
import { DIFFICULTIES } from "../../core/difficulty";
import { generateSudoku } from "./generator";
import { solveByLogic } from "./logic";
import { countSolutions } from "./solver";
import { TIER_SETTINGS } from "./tiers";

const SEEDS = [0, 1, 2, 3, 4, 5];

describe.each(DIFFICULTIES)("generateSudoku for %s", (tier) => {
  const { layout, minHardest, maxHardest, minClues } = TIER_SETTINGS[tier];
  const puzzles = SEEDS.map((seed) => generateSudoku(seed, tier));

  it("makes a grid of the right size", () => {
    puzzles.forEach((puzzle) => {
      expect(puzzle.size).toBe(layout.size);
      expect(puzzle.givens).toHaveLength(layout.size * layout.size);
      expect(puzzle.solution).toHaveLength(layout.size * layout.size);
    });
  });

  it("keeps its givens inside the solution", () => {
    puzzles.forEach((puzzle) => {
      puzzle.givens.forEach((given, index) => {
        if (given !== 0) {
          expect(given).toBe(puzzle.solution[index]);
        }
      });
    });
  });

  it("has exactly one solution, and it is the stored one", () => {
    puzzles.forEach((puzzle) => {
      expect(countSolutions(layout, puzzle.givens, 2)).toBe(1);
      const solved = solveByLogic(layout, puzzle.givens, maxHardest);
      expect(solved.grid).toEqual([...puzzle.solution]);
    });
  });

  it("needs the techniques of its tier, no more and no less", () => {
    puzzles.forEach((puzzle) => {
      const graded = solveByLogic(layout, puzzle.givens, maxHardest);
      expect(graded.solved).toBe(true);
      expect(graded.hardest).toBeGreaterThanOrEqual(minHardest);
      expect(graded.hardest).toBeLessThanOrEqual(maxHardest);
    });
  });

  it("leaves at least the minimum number of clues, and some empty squares", () => {
    puzzles.forEach((puzzle) => {
      const clues = puzzle.givens.filter((digit) => digit !== 0).length;
      expect(clues).toBeGreaterThanOrEqual(minClues);
      expect(clues).toBeLessThan(puzzle.givens.length);
    });
  });

  it("is the same every time for the same seed, and differs between seeds", () => {
    expect(generateSudoku(SEEDS[0], tier)).toEqual(puzzles[0]);
    expect(new Set(puzzles.map((puzzle) => puzzle.givens.join(""))).size).toBe(SEEDS.length);
  });
});

describe("the tiers", () => {
  it("make easy 6x6 with many clues, medium 6x6 with few, and hard 9x9", () => {
    expect(TIER_SETTINGS.easy.layout.size).toBe(6);
    expect(TIER_SETTINGS.medium.layout.size).toBe(6);
    expect(TIER_SETTINGS.hard.layout.size).toBe(9);
    expect(TIER_SETTINGS.easy.minClues).toBeGreaterThan(TIER_SETTINGS.medium.minClues);
    expect(TIER_SETTINGS.hard.minHardest).toBeGreaterThan(TIER_SETTINGS.medium.maxHardest);
  });

  it("need at least two years of puzzles at the weekly rhythm", () => {
    expect(TIER_SETTINGS.easy.poolSize).toBeGreaterThanOrEqual(210);
    expect(TIER_SETTINGS.medium.poolSize).toBeGreaterThanOrEqual(315);
    expect(TIER_SETTINGS.hard.poolSize).toBeGreaterThanOrEqual(210);
  });
});
