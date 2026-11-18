import type { PuzzleMetrics } from "./analysis";

export const TRAIL_TIERS = ["medium", "hard"] as const;

export type TrailTier = (typeof TRAIL_TIERS)[number];

export const TRAIL_WEEKLY_PATTERN: readonly TrailTier[] = [
  "medium",
  "hard",
  "medium",
  "medium",
  "hard",
  "medium",
  "hard",
];

export interface TierRules {
  minWords: number;
  maxWords: number;
  minCommonPangrams: number;
  maxCommonPangrams: number;
  maxAllPangrams: number;
  maxFourLetterShare: number;
  poolSize: number;
}

export const TIER_RULES: Readonly<Record<TrailTier, TierRules>> = {
  medium: {
    minWords: 30,
    maxWords: 50,
    minCommonPangrams: 1,
    maxCommonPangrams: 2,
    maxAllPangrams: 3,
    maxFourLetterShare: 0.4,
    poolSize: 1500,
  },
  hard: {
    minWords: 15,
    maxWords: 29,
    minCommonPangrams: 1,
    maxCommonPangrams: 1,
    maxAllPangrams: 2,
    maxFourLetterShare: 0.35,
    poolSize: 1500,
  },
};

export function fitsTier(metrics: PuzzleMetrics, tier: TrailTier): boolean {
  const rules = TIER_RULES[tier];
  return (
    metrics.commonWords >= rules.minWords &&
    metrics.commonWords <= rules.maxWords &&
    metrics.commonPangrams >= rules.minCommonPangrams &&
    metrics.commonPangrams <= rules.maxCommonPangrams &&
    metrics.allPangrams <= rules.maxAllPangrams &&
    metrics.fourLetterShare <= rules.maxFourLetterShare
  );
}
