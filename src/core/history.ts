import { isRecord } from "./guards";
import { formatUtcDate } from "./doneToday";
import { findStoredValue, saveStoredValue, type KeyValueStore } from "./storage";

export const HISTORY_KEY = "dailyverse:history";
export const MAX_RECORDS = 1500;
export const MAX_SCORE = 5;

export interface PlayRecord {
  game: string;
  date: string;
  score: number;
  maxScore: number;
  won: boolean;
}

export type PlayResult = Omit<PlayRecord, "date">;

export function isPlayRecord(value: unknown): value is PlayRecord {
  return (
    isRecord(value) &&
    typeof value.game === "string" &&
    typeof value.date === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(value.date) &&
    typeof value.score === "number" &&
    value.score >= 0 &&
    typeof value.maxScore === "number" &&
    value.maxScore > 0 &&
    typeof value.won === "boolean"
  );
}

function isHistory(value: unknown): value is PlayRecord[] {
  return Array.isArray(value) && value.every(isPlayRecord);
}

export function loadHistory(store?: KeyValueStore | null): PlayRecord[] {
  return findStoredValue(HISTORY_KEY, isHistory, store) ?? [];
}

export function recordPlay(
  result: PlayResult,
  store?: KeyValueStore | null,
  now: Date = new Date(),
): boolean {
  const record: PlayRecord = { ...result, date: formatUtcDate(now) };
  const kept = loadHistory(store).filter(
    (existing) => existing.game !== record.game || existing.date !== record.date,
  );
  return saveStoredValue(HISTORY_KEY, [...kept, record].slice(-MAX_RECORDS), store);
}
