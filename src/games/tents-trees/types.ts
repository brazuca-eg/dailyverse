import type { Difficulty } from "../../core/difficulty";

export interface Cell {
  row: number;
  col: number;
}

export interface TentsClues {
  size: number;
  trees: readonly Cell[];
  rowCounts: readonly number[];
  colCounts: readonly number[];
}

export interface TentsPuzzle extends TentsClues {
  solution: readonly Cell[];
}

export interface TentsRound {
  seed: number;
  tier: Difficulty;
  puzzle: TentsPuzzle;
}
