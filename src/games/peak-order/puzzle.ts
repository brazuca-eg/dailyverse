import { createRandom, hashString } from "../../core/random";
import { createStartOrder } from "./arrange";
import type { CategoryId } from "./categories";
import { peakData } from "./data";
import { pickDailyPeakPuzzle } from "./daily";
import { ROUND_SIZE, type PeakTier } from "./tiers";
import type { PeakData } from "./types";

export interface PeakItem {
  name: string;
  value: number;
}

export interface PeakPuzzle {
  id: string;
  category: CategoryId;
  tier: PeakTier;
  items: readonly PeakItem[];
  start: readonly number[];
}

export function buildPeakPuzzle(
  category: CategoryId,
  tier: PeakTier,
  poolIndex: number,
  data: PeakData = peakData,
): PeakPuzzle {
  const indexes = data[category][tier][poolIndex];
  if (indexes === undefined) {
    throw new Error(`There is no ${tier} ${category} puzzle number ${poolIndex}`);
  }
  const id = `${category}:${tier}:${poolIndex}`;
  const start = createStartOrder(ROUND_SIZE, createRandom(hashString(`peak-order:start:${id}`)));
  return {
    id,
    category,
    tier,
    items: indexes.map((index) => {
      const [name, value] = data[category].items[index];
      return { name, value };
    }),
    start,
  };
}

export function buildDailyPeakPuzzle(dayIndex: number, data: PeakData = peakData): PeakPuzzle {
  const { category, tier, poolIndex } = pickDailyPeakPuzzle(dayIndex, data);
  return buildPeakPuzzle(category, tier, poolIndex, data);
}
