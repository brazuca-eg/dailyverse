import type { WeatherPuzzle } from "./types";

export interface StoredPuzzle {
  w: number[];
  t: number[];
}

export function encodePuzzle(puzzle: WeatherPuzzle): StoredPuzzle {
  return { w: [...puzzle.weather], t: [...puzzle.trips] };
}

export function decodePuzzle(stored: StoredPuzzle): WeatherPuzzle {
  return { weather: stored.w, trips: stored.t };
}
