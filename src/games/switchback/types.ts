import type { Difficulty } from "../../core/difficulty";

export type Wall = readonly [number, number];

export interface SwitchbackPuzzle {
  size: number;
  marks: readonly number[];
  walls: readonly Wall[];
}

export interface SwitchbackRound {
  tier: Difficulty;
  poolIndex: number;
  puzzle: SwitchbackPuzzle;
  solution: readonly number[];
}
