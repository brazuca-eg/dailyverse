import { COMPASS_DIRECTIONS } from "../../core/distance";
import { isOneOf, isRecord } from "../../core/guards";
import { findStoredValue, saveStoredValue, type KeyValueStore } from "../../core/storage";
import { createEmptyStats, isGameStats, type GameStats } from "../../core/streak";
import { MAX_GUESSES, type GameState, type GameStatus } from "./game";
import type { MysteryPlacePuzzle } from "./types";

export const GAME_STORAGE_KEY = "dailyverse:mystery-place:game";
export const HELP_SEEN_STORAGE_KEY = "dailyverse:mystery-place:help-seen";
const STATS_STORAGE_KEY = "dailyverse:mystery-place:stats";

const GAME_STATUSES: readonly GameStatus[] = ["playing", "won", "lost"];

function isTrue(value: unknown): value is true {
  return value === true;
}

interface SavedGame {
  dayIndex: number;
  state: GameState;
}

function isGuessFeedback(value: unknown): boolean {
  if (!isRecord(value)) {
    return false;
  }
  if (value.isCorrect === true) {
    return true;
  }
  return (
    value.isCorrect === false &&
    typeof value.distanceKm === "number" &&
    isOneOf(COMPASS_DIRECTIONS, value.direction)
  );
}

function isGuessRecord(value: unknown): boolean {
  return (
    isRecord(value) && typeof value.countryCode === "string" && isGuessFeedback(value.feedback)
  );
}

function isSavedGame(value: unknown): value is SavedGame {
  if (!isRecord(value) || !Number.isInteger(value.dayIndex) || !isRecord(value.state)) {
    return false;
  }
  const { puzzleId, guesses, status } = value.state;
  return (
    typeof puzzleId === "string" &&
    Array.isArray(guesses) &&
    guesses.length <= MAX_GUESSES &&
    guesses.every(isGuessRecord) &&
    isOneOf(GAME_STATUSES, status)
  );
}

export function findSavedGameState(
  puzzle: MysteryPlacePuzzle,
  dayIndex: number,
  store?: KeyValueStore | null,
): GameState | null {
  const saved = findStoredValue(GAME_STORAGE_KEY, isSavedGame, store);
  if (!saved || saved.dayIndex !== dayIndex || saved.state.puzzleId !== puzzle.id) {
    return null;
  }
  return saved.state;
}

export function saveGameState(
  dayIndex: number,
  state: GameState,
  store?: KeyValueStore | null,
): boolean {
  return saveStoredValue(GAME_STORAGE_KEY, { dayIndex, state }, store);
}

export function hasSeenHelp(store?: KeyValueStore | null): boolean {
  return findStoredValue(HELP_SEEN_STORAGE_KEY, isTrue, store) === true;
}

export function markHelpSeen(store?: KeyValueStore | null): boolean {
  return saveStoredValue(HELP_SEEN_STORAGE_KEY, true, store);
}

export function loadGameStats(store?: KeyValueStore | null): GameStats {
  return findStoredValue(STATS_STORAGE_KEY, isGameStats, store) ?? createEmptyStats();
}

export function saveGameStats(stats: GameStats, store?: KeyValueStore | null): boolean {
  return saveStoredValue(STATS_STORAGE_KEY, stats, store);
}
