import type { Difficulty } from "../../core/difficulty";
import { pickPoolIndex } from "../../core/dailyPool";
import { decodeGrid } from "./codec";
import { sudokuData, type SudokuData } from "./data";
import { solveGrid } from "./solver";
import { TIER_SETTINGS } from "./tiers";
import type { SudokuRound } from "./types";

export interface DailySudokuPick {
  tier: Difficulty;
  poolIndex: number;
}

export function pickDailySudoku(dayIndex: number, data: SudokuData = sudokuData): DailySudokuPick {
  return pickPoolIndex("trail-sudoku", dayIndex, {
    easy: data.easy.length,
    medium: data.medium.length,
    hard: data.hard.length,
  });
}

export function buildSudokuRound(
  tier: Difficulty,
  poolIndex: number,
  data: SudokuData = sudokuData,
): SudokuRound {
  const text = data[tier][poolIndex];
  if (text === undefined) {
    throw new Error(`There is no ${tier} Trail Sudoku number ${poolIndex}`);
  }
  const givens = decodeGrid(text);
  const { layout } = TIER_SETTINGS[tier];
  const solution = solveGrid(layout, givens);
  if (solution === null) {
    throw new Error(`The ${tier} Trail Sudoku number ${poolIndex} has no solution`);
  }
  return { seed: poolIndex, tier, puzzle: { size: layout.size, givens, solution } };
}

export function buildDailySudokuRound(
  dayIndex: number,
  data: SudokuData = sudokuData,
): SudokuRound {
  const { tier, poolIndex } = pickDailySudoku(dayIndex, data);
  return buildSudokuRound(tier, poolIndex, data);
}

export function findDailySudokuRound(
  dayIndex: number,
  data: SudokuData = sudokuData,
): SudokuRound | null {
  try {
    return buildDailySudokuRound(dayIndex, data);
  } catch {
    return null;
  }
}
