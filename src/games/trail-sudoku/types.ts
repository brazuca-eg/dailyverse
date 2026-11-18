import type { Difficulty } from "../../core/difficulty";

export interface SudokuPuzzle {
  size: number;
  givens: readonly number[];
  solution: readonly number[];
}

export interface SudokuRound {
  seed: number;
  tier: Difficulty;
  puzzle: SudokuPuzzle;
}
