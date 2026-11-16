import type { Difficulty } from "../../core/difficulty";

export interface TierSettings {
  size: number;
  density: number;
  minLookaheads: number;
  maxLookaheads: number;
}

export const TIER_SETTINGS: Readonly<Record<Difficulty, TierSettings>> = {
  easy: { size: 6, density: 0.2, minLookaheads: 0, maxLookaheads: 0 },
  medium: { size: 8, density: 0.2, minLookaheads: 1, maxLookaheads: 6 },
  hard: { size: 10, density: 0.2, minLookaheads: 3, maxLookaheads: 40 },
};
