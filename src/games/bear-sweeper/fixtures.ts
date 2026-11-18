import { buildBearRound } from "./daily";
import { countAdjacentBears } from "./counts";
import type { BearPuzzle } from "./types";

export const easyRound = buildBearRound("easy", 0);
export const mediumRound = buildBearRound("medium", 0);
export const hardRound = buildBearRound("hard", 0);

export const TINY: BearPuzzle = { size: 3, bears: [8], start: 0 };

export function listSafeCells(puzzle: BearPuzzle): number[] {
  return Array.from({ length: puzzle.size * puzzle.size }, (_, index) => index).filter(
    (index) => !puzzle.bears.includes(index),
  );
}

export function findBlankCell(puzzle: BearPuzzle): number {
  return countAdjacentBears(puzzle).findIndex(
    (count, index) => count === 0 && !puzzle.bears.includes(index),
  );
}
