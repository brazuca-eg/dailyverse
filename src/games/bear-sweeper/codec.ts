import type { BearPuzzle } from "./types";

export interface StoredPuzzle {
  b: number[];
  s: number;
}

export function encodePuzzle(puzzle: BearPuzzle): StoredPuzzle {
  return { b: [...puzzle.bears], s: puzzle.start };
}

export function decodePuzzle(size: number, stored: StoredPuzzle): BearPuzzle {
  return { size, bears: stored.b, start: stored.s };
}
