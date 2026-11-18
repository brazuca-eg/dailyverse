import type { Difficulty } from "../../core/difficulty";

export interface TierSettings {
  days: number;
  trips: number;
  previewSeconds: number;
  peeks: number;
  needsConflict: boolean;
  poolSize: number;
}

export const MIN_MARGIN = 2;
export const MIN_DISTINCT_WEATHERS = 3;
export const MIN_BEST_SHARE = 0.75;
export const MAX_BLIND_SHARE = 0.55;

export const TIER_SETTINGS: Readonly<Record<Difficulty, TierSettings>> = {
  easy: { days: 5, trips: 2, previewSeconds: 15, peeks: 2, needsConflict: false, poolSize: 210 },
  medium: { days: 7, trips: 3, previewSeconds: 10, peeks: 2, needsConflict: true, poolSize: 315 },
  hard: { days: 7, trips: 4, previewSeconds: 7, peeks: 1, needsConflict: true, poolSize: 210 },
};
