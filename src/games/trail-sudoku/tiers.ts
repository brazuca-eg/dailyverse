import type { Difficulty } from "../../core/difficulty";
import { LAYOUT_6, LAYOUT_9, type Layout } from "./layout";
import { LEVEL_ADVANCED, LEVEL_HIDDEN, LEVEL_NAKED, LEVEL_SUBSETS } from "./logic";

export interface TierSettings {
  layout: Layout;
  minHardest: number;
  maxHardest: number;
  minClues: number;
  poolSize: number;
}

export const TIER_SETTINGS: Readonly<Record<Difficulty, TierSettings>> = {
  easy: {
    layout: LAYOUT_6,
    minHardest: LEVEL_NAKED,
    maxHardest: LEVEL_NAKED,
    minClues: 18,
    poolSize: 210,
  },
  medium: {
    layout: LAYOUT_6,
    minHardest: LEVEL_HIDDEN,
    maxHardest: LEVEL_HIDDEN,
    minClues: 0,
    poolSize: 315,
  },
  hard: {
    layout: LAYOUT_9,
    minHardest: LEVEL_SUBSETS,
    maxHardest: LEVEL_ADVANCED,
    minClues: 0,
    poolSize: 210,
  },
};
