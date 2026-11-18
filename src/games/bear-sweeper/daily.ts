import type { Difficulty } from "../../core/difficulty";
import { pickPoolIndex } from "../../core/dailyPool";
import { decodePuzzle } from "./codec";
import { bearData, type BearData } from "./data";
import { TIER_SETTINGS } from "./tiers";
import type { BearRound } from "./types";

export interface DailyBearPick {
  tier: Difficulty;
  poolIndex: number;
}

export function pickDailyBears(dayIndex: number, data: BearData = bearData): DailyBearPick {
  return pickPoolIndex("bear-sweeper", dayIndex, {
    easy: data.easy.length,
    medium: data.medium.length,
    hard: data.hard.length,
  });
}

export function buildBearRound(
  tier: Difficulty,
  poolIndex: number,
  data: BearData = bearData,
): BearRound {
  const stored = data[tier][poolIndex];
  if (stored === undefined) {
    throw new Error(`There is no ${tier} Bear Sweeper number ${poolIndex}`);
  }
  return { tier, poolIndex, puzzle: decodePuzzle(TIER_SETTINGS[tier].size, stored) };
}

export function buildDailyBearRound(dayIndex: number, data: BearData = bearData): BearRound {
  const { tier, poolIndex } = pickDailyBears(dayIndex, data);
  return buildBearRound(tier, poolIndex, data);
}

export function findDailyBearRound(dayIndex: number, data: BearData = bearData): BearRound | null {
  try {
    return buildDailyBearRound(dayIndex, data);
  } catch {
    return null;
  }
}
