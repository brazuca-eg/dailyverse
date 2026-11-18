import { createStateStorage } from "../../core/gameStorage";
import { isRecord } from "../../core/guards";
import type { TrailState } from "./game";

function isWord(value: unknown): boolean {
  return typeof value === "string" && /^[a-z]{4,}$/.test(value);
}

export function isTrailState(value: unknown): value is TrailState {
  if (!isRecord(value)) {
    return false;
  }
  const { puzzleId, found, ended } = value;
  return (
    typeof puzzleId === "string" &&
    Array.isArray(found) &&
    found.every(isWord) &&
    new Set(found).size === found.length &&
    typeof ended === "boolean"
  );
}

export const trailWordsStorage = createStateStorage("trail-words", isTrailState);
