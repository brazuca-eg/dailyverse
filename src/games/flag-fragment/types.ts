import type { Difficulty } from "../../core/difficulty";

export interface FlagFocus {
  x: number;
  y: number;
}

export interface FlagEntry {
  code: string;
  difficulty: Difficulty;
  focus: FlagFocus;
}
