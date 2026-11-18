import { DIFFICULTIES, type Difficulty } from "../../src/core/difficulty";
import { encodeGrid } from "../../src/games/trail-sudoku/codec";
import { generateSudoku } from "../../src/games/trail-sudoku/generator";
import { TIER_SETTINGS } from "../../src/games/trail-sudoku/tiers";
import type { SudokuData } from "../../src/games/trail-sudoku/data";

export const SEED_BASES: Readonly<Record<Difficulty, number>> = {
  easy: 100000,
  medium: 200000,
  hard: 300000,
};

export type PoolSizes = Record<Difficulty, number>;

export function buildSudokuData(
  sizes: PoolSizes = {
    easy: TIER_SETTINGS.easy.poolSize,
    medium: TIER_SETTINGS.medium.poolSize,
    hard: TIER_SETTINGS.hard.poolSize,
  },
): SudokuData {
  return Object.fromEntries(
    DIFFICULTIES.map((tier) => {
      const seeds = Array.from({ length: sizes[tier] }, (_, index) => SEED_BASES[tier] + index);
      return [tier, seeds.map((seed) => encodeGrid(generateSudoku(seed, tier).givens))];
    }),
  ) as SudokuData;
}
