import { createStateStorage } from "../../core/gameStorage";
import { isOneOf, isRecord } from "../../core/guards";
import type { GameStatus } from "../../core/guessing";
import type { Move, TentsState } from "./game";

const STATUSES: readonly GameStatus[] = ["playing", "won", "lost"];
const MARK_VALUES = [0, 1, 2];

function isMove(value: unknown): value is Move {
  return (
    isRecord(value) &&
    Number.isInteger(value.index) &&
    MARK_VALUES.includes(value.before as number) &&
    MARK_VALUES.includes(value.after as number)
  );
}

function isCount(value: unknown): boolean {
  return Number.isInteger(value) && (value as number) >= 0;
}

export function isTentsState(value: unknown): value is TentsState {
  if (!isRecord(value)) {
    return false;
  }
  const { puzzleId, marks, moves, checks, hints, elapsedSeconds, status } = value;
  return (
    typeof puzzleId === "string" &&
    Array.isArray(marks) &&
    marks.every((mark) => MARK_VALUES.includes(mark)) &&
    Array.isArray(moves) &&
    moves.every(isMove) &&
    isCount(checks) &&
    isCount(hints) &&
    typeof elapsedSeconds === "number" &&
    elapsedSeconds >= 0 &&
    isOneOf(STATUSES, status)
  );
}

export const tentsTreesStorage = createStateStorage("tents-trees", isTentsState);
