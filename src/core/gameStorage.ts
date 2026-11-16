import { COMPASS_DIRECTIONS } from "./distance";
import { isOneOf, isRecord } from "./guards";
import { MAX_GUESSES, type GameStatus, type GuessingState } from "./guessing";
import { findStoredValue, saveStoredValue, type KeyValueStore } from "./storage";
import { createEmptyStats, isGameStats, type GameStats } from "./streak";

const GAME_STATUSES: readonly GameStatus[] = ["playing", "won", "lost"];

interface SavedGame<T> {
  dayIndex: number;
  state: T;
}

export interface SavedState {
  puzzleId: string;
}

function isTrue(value: unknown): value is true {
  return value === true;
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

export function isGuessingState(value: unknown): value is GuessingState {
  if (!isRecord(value)) {
    return false;
  }
  const { puzzleId, guesses, status } = value;
  return (
    typeof puzzleId === "string" &&
    Array.isArray(guesses) &&
    guesses.length <= MAX_GUESSES &&
    guesses.every(isGuessRecord) &&
    isOneOf(GAME_STATUSES, status)
  );
}

export interface StateStorage<T extends SavedState> {
  keys: { game: string; helpSeen: string; stats: string };
  findSavedState: (puzzleId: string, dayIndex: number, store?: KeyValueStore | null) => T | null;
  saveState: (dayIndex: number, state: T, store?: KeyValueStore | null) => boolean;
  hasSeenHelp: (store?: KeyValueStore | null) => boolean;
  markHelpSeen: (store?: KeyValueStore | null) => boolean;
  loadStats: (store?: KeyValueStore | null) => GameStats;
  saveStats: (stats: GameStats, store?: KeyValueStore | null) => boolean;
}

export type GameStorage = StateStorage<GuessingState>;

export type HelpStorage = Pick<StateStorage<SavedState>, "hasSeenHelp" | "markHelpSeen">;

export function createStateStorage<T extends SavedState>(
  gameId: string,
  isState: (value: unknown) => value is T,
): StateStorage<T> {
  const keys = {
    game: `dailyverse:${gameId}:game`,
    helpSeen: `dailyverse:${gameId}:help-seen`,
    stats: `dailyverse:${gameId}:stats`,
  };
  const isSavedGame = (value: unknown): value is SavedGame<T> =>
    isRecord(value) && Number.isInteger(value.dayIndex) && isState(value.state);
  return {
    keys,
    findSavedState: (puzzleId, dayIndex, store) => {
      const saved = findStoredValue(keys.game, isSavedGame, store);
      return saved && saved.dayIndex === dayIndex && saved.state.puzzleId === puzzleId
        ? saved.state
        : null;
    },
    saveState: (dayIndex, state, store) => saveStoredValue(keys.game, { dayIndex, state }, store),
    hasSeenHelp: (store) => findStoredValue(keys.helpSeen, isTrue, store) === true,
    markHelpSeen: (store) => saveStoredValue(keys.helpSeen, true, store),
    loadStats: (store) => findStoredValue(keys.stats, isGameStats, store) ?? createEmptyStats(),
    saveStats: (stats, store) => saveStoredValue(keys.stats, stats, store),
  };
}

export function createGameStorage(gameId: string): GameStorage {
  return createStateStorage(gameId, isGuessingState);
}
