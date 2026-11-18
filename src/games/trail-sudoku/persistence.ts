import { createStateStorage } from "../../core/gameStorage";
import { isOneOf, isRecord } from "../../core/guards";
import type { GameStatus } from "../../core/guessing";
import type { Move, SudokuState } from "./game";

const STATUSES: readonly GameStatus[] = ["playing", "won", "lost"];
const SIZES = [36, 81];

function isCount(value: unknown): boolean {
  return Number.isInteger(value) && (value as number) >= 0;
}

function isIntegerList(value: unknown, length: number): value is number[] {
  return Array.isArray(value) && value.length === length && value.every(isCount);
}

function isMove(value: unknown): value is Move {
  return isRecord(value) && isCount(value.index) && isCount(value.entry) && isCount(value.notes);
}

export function isSudokuState(value: unknown): value is SudokuState {
  if (!isRecord(value)) {
    return false;
  }
  const { puzzleId, entries, notes, flagged, moves, checks, hints, elapsedSeconds, status } = value;
  const length = Array.isArray(entries) ? entries.length : 0;
  return (
    typeof puzzleId === "string" &&
    SIZES.includes(length) &&
    isIntegerList(entries, length) &&
    isIntegerList(notes, length) &&
    Array.isArray(flagged) &&
    flagged.every(isCount) &&
    Array.isArray(moves) &&
    moves.every(isMove) &&
    isCount(checks) &&
    isCount(hints) &&
    typeof elapsedSeconds === "number" &&
    elapsedSeconds >= 0 &&
    isOneOf(STATUSES, status)
  );
}

export const trailSudokuStorage = createStateStorage("trail-sudoku", isSudokuState);
