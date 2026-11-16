import { isOneOf, isRecord } from "../../core/guards";
import { createStateStorage } from "../../core/gameStorage";
import type { GameStatus } from "../../core/guessing";
import { DIFFERENCE_COUNT } from "./difficulty";
import { MAX_LIVES, type SpotState } from "./game";

const GAME_STATUSES: readonly GameStatus[] = ["playing", "won", "lost"];

export function isSpotState(value: unknown): value is SpotState {
  if (!isRecord(value)) {
    return false;
  }
  const { puzzleId, found, mistakes, status } = value;
  return (
    typeof puzzleId === "string" &&
    Array.isArray(found) &&
    found.length <= DIFFERENCE_COUNT &&
    found.every((id) => typeof id === "string") &&
    Number.isInteger(mistakes) &&
    (mistakes as number) >= 0 &&
    (mistakes as number) <= MAX_LIVES &&
    isOneOf(GAME_STATUSES, status)
  );
}

export const spotDifferenceStorage = createStateStorage("spot-difference", isSpotState);
