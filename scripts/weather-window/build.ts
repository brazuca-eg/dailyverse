import { DIFFICULTIES, type Difficulty } from "../../src/core/difficulty";
import { encodePuzzle, type StoredPuzzle } from "../../src/games/weather-window/codec";
import type { WeatherData } from "../../src/games/weather-window/data";
import { generateWeatherPuzzle } from "../../src/games/weather-window/generator";
import { TIER_SETTINGS } from "../../src/games/weather-window/tiers";

export const SEED_BASES: Readonly<Record<Difficulty, number>> = {
  easy: 1100000,
  medium: 1200000,
  hard: 1300000,
};

export type PoolSizes = Record<Difficulty, number>;

function buildPool(tier: Difficulty, size: number): StoredPuzzle[] {
  const pool = new Map<string, StoredPuzzle>();
  for (let seed = SEED_BASES[tier]; pool.size < size; seed += 1) {
    const stored = encodePuzzle(generateWeatherPuzzle(seed, tier));
    pool.set(JSON.stringify(stored), stored);
  }
  return [...pool.values()];
}

export function buildWeatherData(
  sizes: PoolSizes = {
    easy: TIER_SETTINGS.easy.poolSize,
    medium: TIER_SETTINGS.medium.poolSize,
    hard: TIER_SETTINGS.hard.poolSize,
  },
): WeatherData {
  return Object.fromEntries(
    DIFFICULTIES.map((tier) => [tier, buildPool(tier, sizes[tier])]),
  ) as WeatherData;
}
