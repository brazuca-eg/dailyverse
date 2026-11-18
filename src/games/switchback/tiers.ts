import type { Difficulty } from "../../core/difficulty";

export interface TierSettings {
  size: number;
  wallChance: number;
  minMarks: number;
  maxMarks: number;
  minWalls: number;
  maxWalls: number;
  poolSize: number;
}

export const TIER_SETTINGS: Readonly<Record<Difficulty, TierSettings>> = {
  easy: {
    size: 5,
    wallChance: 0,
    minMarks: 5,
    maxMarks: 8,
    minWalls: 0,
    maxWalls: 0,
    poolSize: 210,
  },
  medium: {
    size: 6,
    wallChance: 0.6,
    minMarks: 3,
    maxMarks: 6,
    minWalls: 3,
    maxWalls: 8,
    poolSize: 315,
  },
  hard: {
    size: 7,
    wallChance: 0.8,
    minMarks: 3,
    maxMarks: 5,
    minWalls: 7,
    maxWalls: 12,
    poolSize: 210,
  },
};
