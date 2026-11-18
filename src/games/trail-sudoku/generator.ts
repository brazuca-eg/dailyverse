import type { Difficulty } from "../../core/difficulty";
import { createRandom, hashSeed, shuffle } from "../../core/random";
import type { Layout } from "./layout";
import { solveByLogic } from "./logic";
import { solveGrid } from "./solver";
import { TIER_SETTINGS } from "./tiers";
import type { SudokuPuzzle } from "./types";

export const MAX_ATTEMPTS = 80;
const ATTEMPT_STRIDE = 7919;

function countClues(grid: readonly number[]): number {
  return grid.filter((digit) => digit !== 0).length;
}

function removeClues(
  solution: readonly number[],
  order: readonly number[],
  layout: Layout,
  maxLevel: number,
  minClues: number,
): number[] {
  return order.reduce(
    (givens, index) => {
      if (countClues(givens) <= minClues) {
        return givens;
      }
      const trial = givens.map((digit, position) => (position === index ? 0 : digit));
      return solveByLogic(layout, trial, maxLevel).solved ? trial : givens;
    },
    [...solution],
  );
}

function tryGenerate(seed: number, tier: Difficulty, attempt: number): SudokuPuzzle | null {
  const { layout, minHardest, maxHardest, minClues } = TIER_SETTINGS[tier];
  const random = createRandom(hashSeed(seed + attempt * ATTEMPT_STRIDE));
  const cells = layout.size * layout.size;
  const solution = solveGrid(
    layout,
    Array.from({ length: cells }, () => 0),
    random,
  );
  if (solution === null) {
    return null;
  }
  const order = shuffle(
    Array.from({ length: cells }, (_, index) => index),
    random,
  );
  const givens = removeClues(solution, order, layout, maxHardest, minClues);
  const graded = solveByLogic(layout, givens, maxHardest);
  const fits = graded.solved && graded.hardest >= minHardest && graded.hardest <= maxHardest;
  return fits ? { size: layout.size, givens, solution } : null;
}

export function generateSudoku(seed: number, tier: Difficulty): SudokuPuzzle {
  const attempts = Array.from({ length: MAX_ATTEMPTS }, (_, attempt) => attempt);
  const puzzle = attempts.reduce<SudokuPuzzle | null>(
    (found, attempt) => found ?? tryGenerate(seed, tier, attempt),
    null,
  );
  if (puzzle === null) {
    throw new Error(`No ${tier} Trail Sudoku could be generated for seed ${seed}`);
  }
  return puzzle;
}
