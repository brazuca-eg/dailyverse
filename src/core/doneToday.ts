import { findStoredValue, saveStoredValue, type KeyValueStore } from "./storage";

function isDateText(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export function buildDoneKey(gameId: string): string {
  return `dailyverse:${gameId}:last-finished`;
}

export function formatUtcDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function markDoneToday(
  gameId: string,
  store?: KeyValueStore | null,
  now: Date = new Date(),
): boolean {
  return saveStoredValue(buildDoneKey(gameId), formatUtcDate(now), store);
}

export function isDoneToday(
  gameId: string,
  store?: KeyValueStore | null,
  now: Date = new Date(),
): boolean {
  return findStoredValue(buildDoneKey(gameId), isDateText, store) === formatUtcDate(now);
}
