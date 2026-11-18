import { buildDailyPeakPuzzle } from "./puzzle";

export const puzzle = buildDailyPeakPuzzle(0);

export const SOLVED = [0, 1, 2, 3, 4];

export const WRONG_ORDERS = [
  [1, 0, 2, 4, 3],
  [1, 2, 0, 3, 4],
  [4, 3, 2, 1, 0],
  [2, 0, 1, 4, 3],
  [3, 4, 0, 1, 2],
];

export function listNames(order: readonly number[]): string[] {
  return order.map((item) => puzzle.items[item].name);
}
