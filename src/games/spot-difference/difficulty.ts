import type { Difficulty } from "../../core/difficulty";

export const DIFFERENCE_COUNT = 5;

export interface TierProfile {
  moveDistance: readonly [number, number];
  resizeShare: readonly [number, number];
  shadeSteps: number;
  minTargetArea: number;
  maxTargetArea: number;
}

export const TIER_PROFILES: Readonly<Record<Difficulty, TierProfile>> = {
  easy: {
    moveDistance: [10, 14],
    resizeShare: [0.14, 0.2],
    shadeSteps: 3,
    minTargetArea: 500,
    maxTargetArea: 5000,
  },
  medium: {
    moveDistance: [6, 9],
    resizeShare: [0.1, 0.14],
    shadeSteps: 3,
    minTargetArea: 300,
    maxTargetArea: 3200,
  },
  hard: {
    moveDistance: [4, 6],
    resizeShare: [0.07, 0.1],
    shadeSteps: 2,
    minTargetArea: 150,
    maxTargetArea: 2200,
  },
};
