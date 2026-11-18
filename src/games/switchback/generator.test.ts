import { describe, expect, it } from "vitest";
import { DIFFICULTIES } from "../../core/difficulty";
import { generateSwitchback } from "./generator";
import { areAdjacent } from "./grid";
import { countSolutions, findSolution } from "./solver";
import { TIER_SETTINGS } from "./tiers";

const SEEDS = [0, 1, 2, 3, 4, 5, 6, 7];

describe.each(DIFFICULTIES)("generateSwitchback for %s", (tier) => {
  const settings = TIER_SETTINGS[tier];
  const puzzles = SEEDS.map((seed) => generateSwitchback(seed, tier));

  it("makes a grid of the right size", () => {
    puzzles.forEach((puzzle) => expect(puzzle.size).toBe(settings.size));
  });

  it("has exactly one solution", () => {
    puzzles.forEach((puzzle) => expect(countSolutions(puzzle, 2)).toBe(1));
  });

  it("keeps its checkpoints and fences inside the tier's limits", () => {
    puzzles.forEach((puzzle) => {
      expect(puzzle.marks.length).toBeGreaterThanOrEqual(settings.minMarks);
      expect(puzzle.marks.length).toBeLessThanOrEqual(settings.maxMarks);
      expect(puzzle.walls.length).toBeGreaterThanOrEqual(settings.minWalls);
      expect(puzzle.walls.length).toBeLessThanOrEqual(settings.maxWalls);
    });
  });

  it("has different checkpoints on squares of the grid, and fences between neighbours", () => {
    puzzles.forEach((puzzle) => {
      const cells = puzzle.size * puzzle.size;
      expect(new Set(puzzle.marks).size).toBe(puzzle.marks.length);
      puzzle.marks.forEach((mark) => expect(mark).toBeGreaterThanOrEqual(0));
      puzzle.marks.forEach((mark) => expect(mark).toBeLessThan(cells));
      puzzle.walls.forEach(([first, second]) =>
        expect(areAdjacent(puzzle.size, first, second)).toBe(true),
      );
    });
  });

  it("is the same for the same seed, and differs between seeds", () => {
    expect(generateSwitchback(SEEDS[0], tier)).toEqual(puzzles[0]);
    expect(new Set(puzzles.map((puzzle) => JSON.stringify(puzzle))).size).toBe(SEEDS.length);
  });

  it("has a solution that starts at the first checkpoint and ends at the last", () => {
    puzzles.forEach((puzzle) => {
      const solution = findSolution(puzzle) as number[];
      expect(solution[0]).toBe(puzzle.marks[0]);
      expect(solution[solution.length - 1]).toBe(puzzle.marks[puzzle.marks.length - 1]);
    });
  });
});

describe("the tiers", () => {
  it("get bigger and more fenced from easy to hard, and easy has no fences", () => {
    expect(TIER_SETTINGS.easy.size).toBeLessThan(TIER_SETTINGS.medium.size);
    expect(TIER_SETTINGS.medium.size).toBeLessThan(TIER_SETTINGS.hard.size);
    expect(TIER_SETTINGS.easy.maxWalls).toBe(0);
    expect(TIER_SETTINGS.hard.minWalls).toBeGreaterThan(TIER_SETTINGS.medium.minWalls);
  });

  it("need two years of puzzles at the weekly rhythm", () => {
    expect(TIER_SETTINGS.easy.poolSize).toBeGreaterThanOrEqual(210);
    expect(TIER_SETTINGS.medium.poolSize).toBeGreaterThanOrEqual(315);
    expect(TIER_SETTINGS.hard.poolSize).toBeGreaterThanOrEqual(210);
  });
});
