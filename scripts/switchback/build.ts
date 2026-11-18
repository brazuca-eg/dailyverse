import { DIFFICULTIES, type Difficulty } from "../../src/core/difficulty";
import { encodePuzzle } from "../../src/games/switchback/codec";
import type { SwitchbackData } from "../../src/games/switchback/data";
import { generateSwitchback } from "../../src/games/switchback/generator";
import { TIER_SETTINGS } from "../../src/games/switchback/tiers";

export const SEED_BASES: Readonly<Record<Difficulty, number>> = {
  easy: 400000,
  medium: 500000,
  hard: 600000,
};

export type PoolSizes = Record<Difficulty, number>;

export function buildSwitchbackData(
  sizes: PoolSizes = {
    easy: TIER_SETTINGS.easy.poolSize,
    medium: TIER_SETTINGS.medium.poolSize,
    hard: TIER_SETTINGS.hard.poolSize,
  },
): SwitchbackData {
  return Object.fromEntries(
    DIFFICULTIES.map((tier) => {
      const seeds = Array.from({ length: sizes[tier] }, (_, index) => SEED_BASES[tier] + index);
      return [tier, seeds.map((seed) => encodePuzzle(generateSwitchback(seed, tier)))];
    }),
  ) as SwitchbackData;
}
