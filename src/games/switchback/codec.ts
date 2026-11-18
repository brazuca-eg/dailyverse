import type { SwitchbackPuzzle, Wall } from "./types";

export interface StoredPuzzle {
  m: number[];
  w: number[];
}

export function encodePuzzle(puzzle: SwitchbackPuzzle): StoredPuzzle {
  return { m: [...puzzle.marks], w: puzzle.walls.flatMap(([first, second]) => [first, second]) };
}

export function decodePuzzle(size: number, stored: StoredPuzzle): SwitchbackPuzzle {
  const walls: Wall[] = Array.from({ length: Math.floor(stored.w.length / 2) }, (_, index) => [
    stored.w[index * 2],
    stored.w[index * 2 + 1],
  ]);
  return { size, marks: stored.m, walls };
}
