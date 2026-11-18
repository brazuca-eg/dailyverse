import { DIFFICULTIES, type Difficulty } from "../../src/core/difficulty";
import { encodePuzzle } from "../../src/games/bear-sweeper/codec";
import type { BearData } from "../../src/games/bear-sweeper/data";
import { generateBearPuzzle } from "../../src/games/bear-sweeper/generator";
import { TIER_SETTINGS } from "../../src/games/bear-sweeper/tiers";

export const SEED_BASES: Readonly<Record<Difficulty, number>> = {
  easy: 700000,
  medium: 800000,
  hard: 900000,
};

export type PoolSizes = Record<Difficulty, number>;

export function buildBearData(
  sizes: PoolSizes = {
    easy: TIER_SETTINGS.easy.poolSize,
    medium: TIER_SETTINGS.medium.poolSize,
    hard: TIER_SETTINGS.hard.poolSize,
  },
): BearData {
  return Object.fromEntries(
    DIFFICULTIES.map((tier) => {
      const seeds = Array.from({ length: sizes[tier] }, (_, index) => SEED_BASES[tier] + index);
      return [tier, seeds.map((seed) => encodePuzzle(generateBearPuzzle(seed, tier)))];
    }),
  ) as BearData;
}
