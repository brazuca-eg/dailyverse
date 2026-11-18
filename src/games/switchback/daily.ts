import type { Difficulty } from "../../core/difficulty";
import { pickPoolIndex } from "../../core/dailyPool";
import { decodePuzzle } from "./codec";
import { switchbackData, type SwitchbackData } from "./data";
import { findSolution } from "./solver";
import { TIER_SETTINGS } from "./tiers";
import type { SwitchbackRound } from "./types";

export interface DailySwitchbackPick {
  tier: Difficulty;
  poolIndex: number;
}

export function pickDailySwitchback(
  dayIndex: number,
  data: SwitchbackData = switchbackData,
): DailySwitchbackPick {
  return pickPoolIndex("switchback", dayIndex, {
    easy: data.easy.length,
    medium: data.medium.length,
    hard: data.hard.length,
  });
}

export function buildSwitchbackRound(
  tier: Difficulty,
  poolIndex: number,
  data: SwitchbackData = switchbackData,
): SwitchbackRound {
  const stored = data[tier][poolIndex];
  if (stored === undefined) {
    throw new Error(`There is no ${tier} Switchback number ${poolIndex}`);
  }
  const puzzle = decodePuzzle(TIER_SETTINGS[tier].size, stored);
  const solution = findSolution(puzzle);
  if (solution === null) {
    throw new Error(`The ${tier} Switchback number ${poolIndex} has no solution`);
  }
  return { tier, poolIndex, puzzle, solution };
}

export function buildDailySwitchbackRound(
  dayIndex: number,
  data: SwitchbackData = switchbackData,
): SwitchbackRound {
  const { tier, poolIndex } = pickDailySwitchback(dayIndex, data);
  return buildSwitchbackRound(tier, poolIndex, data);
}

export function findDailySwitchbackRound(
  dayIndex: number,
  data: SwitchbackData = switchbackData,
): SwitchbackRound | null {
  try {
    return buildDailySwitchbackRound(dayIndex, data);
  } catch {
    return null;
  }
}
