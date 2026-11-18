import type { Difficulty } from "../../core/difficulty";

export interface BearPuzzle {
  size: number;
  bears: readonly number[];
  start: number;
}

export interface BearRound {
  tier: Difficulty;
  poolIndex: number;
  puzzle: BearPuzzle;
}
