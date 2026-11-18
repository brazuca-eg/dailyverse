import { createStateStorage } from "../../core/gameStorage";
import { isNonNegativeInteger, isOneOf, isRecord } from "../../core/guards";
import type { GameStatus } from "../../core/guessing";
import type { SwitchbackState } from "./game";

const STATUSES: readonly GameStatus[] = ["playing", "won", "lost"];
const MAX_CELLS = 49;

export function isSwitchbackState(value: unknown): value is SwitchbackState {
  if (!isRecord(value)) {
    return false;
  }
  const { puzzleId, path, hints, elapsedSeconds, status } = value;
  return (
    typeof puzzleId === "string" &&
    Array.isArray(path) &&
    path.length >= 1 &&
    path.length <= MAX_CELLS &&
    path.every(isNonNegativeInteger) &&
    isNonNegativeInteger(hints) &&
    typeof elapsedSeconds === "number" &&
    elapsedSeconds >= 0 &&
    isOneOf(STATUSES, status)
  );
}

export const switchbackStorage = createStateStorage("switchback", isSwitchbackState);
