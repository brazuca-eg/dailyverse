import type { Difficulty } from "../../core/difficulty";

export const UNPLACED = -1;

export interface WeatherPuzzle {
  weather: number[];
  trips: number[];
}

export interface WeatherRound {
  tier: Difficulty;
  poolIndex: number;
  puzzle: WeatherPuzzle;
}
