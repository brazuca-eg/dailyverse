import { pickDailySpec, type DailySpec } from "../../core/daily";
import { generateTentsPuzzle } from "./generator";
import type { TentsRound } from "./types";

export const TENTS_LAUNCH_DATE = new Date("2026-11-16T00:00:00Z");

const SEED_OFFSET = 2000;

export function pickDailyTentsSpec(dayIndex: number): DailySpec {
  return pickDailySpec(dayIndex, SEED_OFFSET);
}

export function buildDailyRound(dayIndex: number): TentsRound {
  const { seed, tier } = pickDailyTentsSpec(dayIndex);
  return { seed, tier, puzzle: generateTentsPuzzle(seed, tier) };
}

export function findDailyRound(dayIndex: number): TentsRound | null {
  try {
    return buildDailyRound(dayIndex);
  } catch {
    return null;
  }
}
