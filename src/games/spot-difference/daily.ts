import { WEEKLY_DIFFICULTY_PATTERN, type Difficulty } from "../../core/difficulty";
import { generatePuzzle } from "./puzzle";
import type { Puzzle } from "./types";

export const SPOT_LAUNCH_DATE = new Date("2026-11-16T00:00:00Z");

const SEED_OFFSET = 1000;

export interface DailyPuzzleSpec {
  seed: number;
  tier: Difficulty;
}

export function pickDailyPuzzleSpec(dayIndex: number): DailyPuzzleSpec {
  const weekday =
    ((dayIndex % WEEKLY_DIFFICULTY_PATTERN.length) + WEEKLY_DIFFICULTY_PATTERN.length) %
    WEEKLY_DIFFICULTY_PATTERN.length;
  return { seed: dayIndex + SEED_OFFSET, tier: WEEKLY_DIFFICULTY_PATTERN[weekday] };
}

export function findDailyPuzzle(dayIndex: number): Puzzle | null {
  try {
    return buildDailyPuzzle(dayIndex);
  } catch {
    return null;
  }
}

export function buildDailyPuzzle(dayIndex: number): Puzzle {
  const { seed, tier } = pickDailyPuzzleSpec(dayIndex);
  return generatePuzzle(seed, tier);
}
