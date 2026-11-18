import { describe, expect, it } from "vitest";
import { DIFFICULTIES } from "../../core/difficulty";
import { countAdjacentBears, listStartCells } from "./counts";
import { generateBearPuzzle } from "./generator";
import { readNeighbours } from "./grid";
import { solveByLogic } from "./logic";
import { TIER_SETTINGS } from "./tiers";

const SEEDS = [0, 1, 2, 3, 4, 5, 6, 7];

describe.each(DIFFICULTIES)("generateBearPuzzle for %s", (tier) => {
  const settings = TIER_SETTINGS[tier];
  const puzzles = SEEDS.map((seed) => generateBearPuzzle(seed, tier));

  it("makes a grid of the right size with the right number of different bears", () => {
    puzzles.forEach((puzzle) => {
      const cells = settings.size * settings.size;
      expect(puzzle.size).toBe(settings.size);
      expect(puzzle.bears).toHaveLength(settings.bears);
      expect(new Set(puzzle.bears).size).toBe(settings.bears);
      puzzle.bears.forEach((bear) => {
        expect(bear).toBeGreaterThanOrEqual(0);
        expect(bear).toBeLessThan(cells);
      });
    });
  });

  it("keeps the bears away from the starting clearing", () => {
    puzzles.forEach((puzzle) => {
      const protectedCells = [puzzle.start, ...readNeighbours(puzzle.size)[puzzle.start]];
      protectedCells.forEach((cell) => expect(puzzle.bears).not.toContain(cell));
      expect(countAdjacentBears(puzzle)[puzzle.start]).toBe(0);
    });
  });

  it("can be solved by logic alone, within the tier's level, with no wrong deduction", () => {
    puzzles.forEach((puzzle) => {
      const result = solveByLogic(puzzle, settings.maxLevel);
      expect(result.solved).toBe(true);
      expect(result.mistakes).toBe(0);
      expect(result.hardest).toBeGreaterThanOrEqual(settings.minLevel);
      expect(result.hardest).toBeLessThanOrEqual(settings.maxLevel);
    });
  });

  it("does not open too much of the board at the start", () => {
    puzzles.forEach((puzzle) => {
      const share = listStartCells(puzzle).length / (settings.size ** 2 - settings.bears);
      expect(share).toBeLessThanOrEqual(settings.maxOpenShare);
    });
  });

  it("is the same for the same seed, and differs between seeds", () => {
    expect(generateBearPuzzle(SEEDS[0], tier)).toEqual(puzzles[0]);
    expect(new Set(puzzles.map((puzzle) => JSON.stringify(puzzle))).size).toBe(SEEDS.length);
  });
});

describe("the tiers", () => {
  it("get bigger, with more bears and harder techniques, from easy to hard", () => {
    expect(TIER_SETTINGS.easy.size).toBeLessThan(TIER_SETTINGS.medium.size);
    expect(TIER_SETTINGS.medium.size).toBeLessThan(TIER_SETTINGS.hard.size);
    expect(TIER_SETTINGS.easy.bears).toBeLessThan(TIER_SETTINGS.medium.bears);
    expect(TIER_SETTINGS.medium.bears).toBeLessThan(TIER_SETTINGS.hard.bears);
    expect(TIER_SETTINGS.easy.maxLevel).toBeLessThan(TIER_SETTINGS.medium.maxLevel);
    expect(TIER_SETTINGS.medium.maxLevel).toBeLessThan(TIER_SETTINGS.hard.maxLevel);
  });

  it("need two years of puzzles at the weekly rhythm", () => {
    expect(TIER_SETTINGS.easy.poolSize).toBeGreaterThanOrEqual(210);
    expect(TIER_SETTINGS.medium.poolSize).toBeGreaterThanOrEqual(315);
    expect(TIER_SETTINGS.hard.poolSize).toBeGreaterThanOrEqual(210);
  });
});
