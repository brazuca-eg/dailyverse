import { isNonNegativeInteger, isRecord } from "./guards";

export interface GameStats {
  gamesPlayed: number;
  gamesWon: number;
  currentStreak: number;
  maxStreak: number;
  lastCompletedDay: number | null;
}

export function createEmptyStats(): GameStats {
  return { gamesPlayed: 0, gamesWon: 0, currentStreak: 0, maxStreak: 0, lastCompletedDay: null };
}

export function isGameStats(value: unknown): value is GameStats {
  return (
    isRecord(value) &&
    isNonNegativeInteger(value.gamesPlayed) &&
    isNonNegativeInteger(value.gamesWon) &&
    isNonNegativeInteger(value.currentStreak) &&
    isNonNegativeInteger(value.maxStreak) &&
    (value.lastCompletedDay === null || Number.isInteger(value.lastCompletedDay))
  );
}

export function applyGameResult(stats: GameStats, dayIndex: number, won: boolean): GameStats {
  if (stats.lastCompletedDay === dayIndex) {
    return stats;
  }
  const continuesStreak = stats.lastCompletedDay === dayIndex - 1;
  let currentStreak = 0;
  if (won) {
    currentStreak = continuesStreak ? stats.currentStreak + 1 : 1;
  }
  return {
    gamesPlayed: stats.gamesPlayed + 1,
    gamesWon: stats.gamesWon + (won ? 1 : 0),
    currentStreak,
    maxStreak: Math.max(stats.maxStreak, currentStreak),
    lastCompletedDay: dayIndex,
  };
}

export function calculateActiveStreak(stats: GameStats, todayDayIndex: number): number {
  if (stats.lastCompletedDay === null || stats.lastCompletedDay < todayDayIndex - 1) {
    return 0;
  }
  return stats.currentStreak;
}

export function calculateWinRatePercent(stats: GameStats): number {
  if (stats.gamesPlayed === 0) {
    return 0;
  }
  return Math.round((stats.gamesWon / stats.gamesPlayed) * 100);
}
