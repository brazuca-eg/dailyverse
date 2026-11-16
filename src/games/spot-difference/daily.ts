import { pickDailySpec, type DailySpec } from "../../core/daily";
import { generatePuzzle } from "./puzzle";
import type { Puzzle } from "./types";

export const SPOT_LAUNCH_DATE = new Date("2026-11-16T00:00:00Z");

const SEED_OFFSET = 1000;

export function pickDailyPuzzleSpec(dayIndex: number): DailySpec {
  return pickDailySpec(dayIndex, SEED_OFFSET);
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
