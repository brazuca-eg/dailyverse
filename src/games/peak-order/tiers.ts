import type { Item } from "./items";

export const PEAK_TIERS = ["medium", "hard"] as const;

export type PeakTier = (typeof PEAK_TIERS)[number];

export const ROUND_SIZE = 5;

export interface TierRules {
  candidateCount: number;
  floorEditions: number;
  minRatio: number;
  maxClosestRatio: number;
  poolSize: number;
}

export const TIER_RULES: Record<PeakTier, TierRules> = {
  medium: {
    candidateCount: 100,
    floorEditions: 20,
    minRatio: 1.15,
    maxClosestRatio: Number.POSITIVE_INFINITY,
    poolSize: 90,
  },
  hard: {
    candidateCount: 250,
    floorEditions: 10,
    minRatio: 1.03,
    maxClosestRatio: 1.08,
    poolSize: 70,
  },
};

export const PEAK_WEEKLY_PATTERN: readonly PeakTier[] = [
  "medium",
  "hard",
  "medium",
  "medium",
  "hard",
  "medium",
  "hard",
];

export interface SetMetrics {
  closestRatio: number;
  minEditions: number;
  isAscending: boolean;
}

export function measureSet(items: readonly Item[]): SetMetrics {
  const ratios = items.slice(1).map((item, index) => item.value / items[index].value);
  return {
    closestRatio: Math.min(...ratios),
    minEditions: Math.min(...items.map((item) => item.editions)),
    isAscending: ratios.every((ratio) => ratio > 1),
  };
}

export function fitsTier(items: readonly Item[], tier: PeakTier, minEditions: number): boolean {
  const rules = TIER_RULES[tier];
  const metrics = measureSet(items);
  return (
    items.length === ROUND_SIZE &&
    metrics.isAscending &&
    new Set(items.map((item) => item.name)).size === ROUND_SIZE &&
    metrics.minEditions >= minEditions &&
    metrics.closestRatio >= rules.minRatio &&
    metrics.closestRatio <= rules.maxClosestRatio
  );
}
