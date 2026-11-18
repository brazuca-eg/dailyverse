import { buildSwitchbackRound } from "./daily";
import { toCol, toRow } from "./grid";
import type { SwitchbackPuzzle } from "./types";

export const easyRound = buildSwitchbackRound("easy", 0);
export const mediumRound = buildSwitchbackRound("medium", 0);
export const hardRound = buildSwitchbackRound("hard", 0);

export const TINY: SwitchbackPuzzle = { size: 3, marks: [0, 8], walls: [] };

export function listDirections(size: number, cells: readonly number[]): string[] {
  return cells.slice(1).map((cell, step) => {
    const previous = cells[step];
    if (toRow(size, cell) < toRow(size, previous)) {
      return "ArrowUp";
    }
    if (toRow(size, cell) > toRow(size, previous)) {
      return "ArrowDown";
    }
    return toCol(size, cell) > toCol(size, previous) ? "ArrowRight" : "ArrowLeft";
  });
}
