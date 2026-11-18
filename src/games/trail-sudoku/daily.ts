import { WEEKLY_DIFFICULTY_PATTERN, type Difficulty } from "../../core/difficulty";
import { modulo } from "../../core/modulo";
import { createRandom, hashString, shuffle } from "../../core/random";
import { decodeGrid } from "./codec";
import { sudokuData, type SudokuData } from "./data";
import { solveGrid } from "./solver";
import { TIER_SETTINGS } from "./tiers";
import type { SudokuRound } from "./types";

export interface DailySudokuPick {
  tier: Difficulty;
  poolIndex: number;
}

const orders = new Map<string, number[]>();

function readOrder(tier: Difficulty, size: number): number[] {
  const key = `${tier}:${size}`;
  const known = orders.get(key);
  if (known) {
    return known;
  }
  const order = shuffle(
    Array.from({ length: size }, (_, index) => index),
    createRandom(hashString(`trail-sudoku:order:${key}`)),
  );
  orders.set(key, order);
  return order;
}

function countInWeek(tier: Difficulty, until = WEEKLY_DIFFICULTY_PATTERN.length): number {
  return WEEKLY_DIFFICULTY_PATTERN.slice(0, until).filter((candidate) => candidate === tier).length;
}

export function pickDailySudoku(dayIndex: number, data: SudokuData = sudokuData): DailySudokuPick {
  const weekLength = WEEKLY_DIFFICULTY_PATTERN.length;
  const weekday = modulo(dayIndex, weekLength);
  const tier = WEEKLY_DIFFICULTY_PATTERN[weekday];
  const week = Math.floor(dayIndex / weekLength);
  const occurrence = week * countInWeek(tier) + countInWeek(tier, weekday);
  const order = readOrder(tier, data[tier].length);
  return { tier, poolIndex: order[modulo(occurrence, order.length)] };
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
