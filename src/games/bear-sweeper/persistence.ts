import { createStateStorage } from "../../core/gameStorage";
import { isNonNegativeInteger, isOneOf, isRecord } from "../../core/guards";
import type { GameStatus } from "../../core/guessing";
import { TRIGGERED, type BearState } from "./game";

const STATUSES: readonly GameStatus[] = ["playing", "won", "lost"];
const CELL_COUNTS = [49, 81, 121];

export function isBearState(value: unknown): value is BearState {
  if (!isRecord(value)) {
    return false;
  }
  const { puzzleId, cells, hints, elapsedSeconds, status } = value;
  return (
    typeof puzzleId === "string" &&
    Array.isArray(cells) &&
    CELL_COUNTS.includes(cells.length) &&
    cells.every((cell) => Number.isInteger(cell) && cell >= 0 && cell <= TRIGGERED) &&
    isNonNegativeInteger(hints) &&
    typeof elapsedSeconds === "number" &&
    elapsedSeconds >= 0 &&
    isOneOf(STATUSES, status)
  );
}

export const bearSweeperStorage = createStateStorage("bear-sweeper", isBearState);
