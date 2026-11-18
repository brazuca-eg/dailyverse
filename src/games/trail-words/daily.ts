import { createRandom, hashString, shuffle } from "../../core/random";
import puzzleData from "./puzzles.json";
import { TRAIL_WEEKLY_PATTERN, type TrailTier } from "./tiers";

export const TRAIL_LAUNCH_DATE = new Date("2026-11-16T00:00:00Z");

const pools = puzzleData as Record<TrailTier, string[]>;
const orders = new Map<TrailTier, number[]>();

export interface DailyPick {
  tier: TrailTier;
  code: string;
}

function mod(value: number, divisor: number): number {
  return ((value % divisor) + divisor) % divisor;
}

function readOrder(tier: TrailTier): number[] {
  const known = orders.get(tier);
  if (known) {
    return known;
  }
  const order = shuffle(
    pools[tier].map((_, index) => index),
    createRandom(hashString(`trail-words:${tier}`)),
  );
  orders.set(tier, order);
  return order;
}

function countInWeek(tier: TrailTier, until = TRAIL_WEEKLY_PATTERN.length): number {
  return TRAIL_WEEKLY_PATTERN.slice(0, until).filter((candidate) => candidate === tier).length;
}

export function pickDailyTrailPuzzle(dayIndex: number): DailyPick {
  const week = Math.floor(dayIndex / TRAIL_WEEKLY_PATTERN.length);
  const weekday = mod(dayIndex, TRAIL_WEEKLY_PATTERN.length);
  const tier = TRAIL_WEEKLY_PATTERN[weekday];
  const occurrence = week * countInWeek(tier) + countInWeek(tier, weekday);
  const order = readOrder(tier);
  return { tier, code: pools[tier][order[mod(occurrence, order.length)]] };
}
