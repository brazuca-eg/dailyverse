import type { Difficulty } from "../../core/difficulty";
import { LEVEL_ADVANCED, LEVEL_SINGLE, LEVEL_SUBSET } from "./logic";

export interface TierSettings {
  size: number;
  bears: number;
  minLevel: number;
  maxLevel: number;
  maxOpenShare: number;
  poolSize: number;
}

export const TIER_SETTINGS: Readonly<Record<Difficulty, TierSettings>> = {
  easy: {
    size: 7,
    bears: 8,
    minLevel: LEVEL_SINGLE,
    maxLevel: LEVEL_SINGLE,
    maxOpenShare: 0.6,
    poolSize: 210,
  },
  medium: {
    size: 9,
    bears: 15,
    minLevel: LEVEL_SUBSET,
    maxLevel: LEVEL_SUBSET,
    maxOpenShare: 0.5,
    poolSize: 315,
  },
  hard: {
    size: 11,
    bears: 24,
    minLevel: LEVEL_ADVANCED,
    maxLevel: LEVEL_ADVANCED,
    maxOpenShare: 0.4,
    poolSize: 210,
  },
};
