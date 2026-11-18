import { buildSudokuRound } from "./daily";

export const easyRound = buildSudokuRound("easy", 0);
export const mediumRound = buildSudokuRound("medium", 0);
export const hardRound = buildSudokuRound("hard", 0);

export const CLASSIC_GIVENS =
  "530070000600195000098000060800060003400803001700020006060000280000419005000080079";
export const CLASSIC_SOLUTION =
  "534678912672195348198342567859761423426853791713924856961537284287419635345286179";

export function toDigits(text: string): number[] {
  return [...text].map(Number);
}

export function findEmptyCells(round: typeof easyRound): number[] {
  return round.puzzle.givens
    .map((given, index) => (given === 0 ? index : -1))
    .filter((index) => index >= 0);
}
