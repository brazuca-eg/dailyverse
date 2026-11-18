import { modulo } from "../../core/modulo";
import { createRandom, hashString, shuffle } from "../../core/random";
import { CATEGORY_IDS, type CategoryId } from "./categories";
import { peakData } from "./data";
import { PEAK_WEEKLY_PATTERN, type PeakTier } from "./tiers";
import type { PeakData } from "./types";

export interface DailyPeakPick {
  category: CategoryId;
  tier: PeakTier;
  poolIndex: number;
}

const CYCLE_LENGTH = CATEGORY_IDS.length * PEAK_WEEKLY_PATTERN.length;
const orders = new Map<string, number[]>();

function readOrder(category: CategoryId, tier: PeakTier, size: number): number[] {
  const key = `${category}:${tier}:${size}`;
  const known = orders.get(key);
  if (known) {
    return known;
  }
  const order = shuffle(
    Array.from({ length: size }, (_, index) => index),
    createRandom(hashString(`peak-order:order:${key}`)),
  );
  orders.set(key, order);
  return order;
}

function readCategory(dayIndex: number): CategoryId {
  return CATEGORY_IDS[modulo(dayIndex, CATEGORY_IDS.length)];
}

function readTier(dayIndex: number): PeakTier {
  return PEAK_WEEKLY_PATTERN[modulo(dayIndex, PEAK_WEEKLY_PATTERN.length)];
}

function countEarlierInCycle(category: CategoryId, tier: PeakTier, dayInCycle: number): number {
  return Array.from({ length: dayInCycle }, (_, day) => day).filter(
    (day) => readCategory(day) === category && readTier(day) === tier,
  ).length;
}

export function pickDailyPeakPuzzle(dayIndex: number, data: PeakData = peakData): DailyPeakPick {
  const category = readCategory(dayIndex);
  const tier = readTier(dayIndex);
  const cycle = Math.floor(dayIndex / CYCLE_LENGTH);
  const perCycle = countEarlierInCycle(category, tier, CYCLE_LENGTH);
  const occurrence =
    cycle * perCycle + countEarlierInCycle(category, tier, modulo(dayIndex, CYCLE_LENGTH));
  const pool = data[category][tier];
  const order = readOrder(category, tier, pool.length);
  return { category, tier, poolIndex: order[modulo(occurrence, order.length)] };
}
