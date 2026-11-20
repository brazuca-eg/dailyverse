import type { PlayRecord } from "./history";

const MILLIS_PER_DAY = 24 * 60 * 60 * 1000;

export interface Overview {
  played: number;
  wins: number;
  winRate: number;
  totalPoints: number;
  averageScore: number;
  currentStreak: number;
  bestStreak: number;
  playedToday: number;
}

export interface GameTotals {
  played: number;
  wins: number;
  points: number;
}

export interface DayCell {
  date: string;
  count: number;
  points: number;
}

export function toDayNumber(date: string): number {
  return Math.round(Date.parse(`${date}T00:00:00Z`) / MILLIS_PER_DAY);
}

export function toDateText(dayNumber: number): string {
  return new Date(dayNumber * MILLIS_PER_DAY).toISOString().slice(0, 10);
}

function listPlayedDays(history: readonly PlayRecord[]): number[] {
  return [...new Set(history.map((record) => toDayNumber(record.date)))].sort((a, b) => a - b);
}

function countStreakEndingAt(days: ReadonlySet<number>, last: number): number {
  return days.has(last) ? 1 + countStreakEndingAt(days, last - 1) : 0;
}

export function calculateCurrentStreak(history: readonly PlayRecord[], todayDate: string): number {
  const days = new Set(listPlayedDays(history));
  const today = toDayNumber(todayDate);
  return countStreakEndingAt(days, days.has(today) ? today : today - 1);
}

export function calculateBestStreak(history: readonly PlayRecord[]): number {
  const days = listPlayedDays(history);
  const lengths = days.map((day, index) =>
    days[index - 1] === day - 1 ? 0 : countRun(new Set(days), day),
  );
  return Math.max(0, ...lengths);
}

function countRun(days: ReadonlySet<number>, first: number): number {
  return days.has(first) ? 1 + countRun(days, first + 1) : 0;
}

export function summarise(history: readonly PlayRecord[], todayDate: string): Overview {
  const played = history.length;
  const wins = history.filter((record) => record.won).length;
  const totalPoints = history.reduce((sum, record) => sum + record.score, 0);
  return {
    played,
    wins,
    winRate: played === 0 ? 0 : Math.round((wins / played) * 100),
    totalPoints,
    averageScore: played === 0 ? 0 : Math.round((totalPoints / played) * 10) / 10,
    currentStreak: calculateCurrentStreak(history, todayDate),
    bestStreak: calculateBestStreak(history),
    playedToday: history.filter((record) => record.date === todayDate).length,
  };
}

export function summariseByGame(history: readonly PlayRecord[]): Map<string, GameTotals> {
  return history.reduce((totals, record) => {
    const known = totals.get(record.game) ?? { played: 0, wins: 0, points: 0 };
    return totals.set(record.game, {
      played: known.played + 1,
      wins: known.wins + (record.won ? 1 : 0),
      points: known.points + record.score,
    });
  }, new Map<string, GameTotals>());
}

export function buildDayCells(
  history: readonly PlayRecord[],
  todayDate: string,
  days: number,
): DayCell[] {
  const today = toDayNumber(todayDate);
  return Array.from({ length: days }, (_, index) => {
    const date = toDateText(today - (days - 1 - index));
    const records = history.filter((record) => record.date === date);
    return {
      date,
      count: records.length,
      points: records.reduce((sum, record) => sum + record.score, 0),
    };
  });
}
