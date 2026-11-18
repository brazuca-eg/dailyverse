import type { Difficulty } from "../../core/difficulty";
import { createRandom, hashSeed, shuffle } from "../../core/random";
import { TRIPS, WEATHERS } from "./catalogue";
import { analysePuzzle, readMaxPoints } from "./solver";
import {
  MAX_BLIND_SHARE,
  MIN_BEST_SHARE,
  MIN_DISTINCT_WEATHERS,
  MIN_MARGIN,
  TIER_SETTINGS,
  type TierSettings,
} from "./tiers";
import type { WeatherPuzzle } from "./types";

const MAX_ATTEMPTS = 5000;

function drawPuzzle(random: () => number, settings: TierSettings): WeatherPuzzle {
  const trips = shuffle(
    TRIPS.map((_, index) => index),
    random,
  )
    .slice(0, settings.trips)
    .sort((first, second) => first - second);
  const weather = Array.from({ length: settings.days }, () =>
    Math.floor(random() * WEATHERS.length),
  );
  return { weather, trips };
}

export function isPuzzleAcceptable(puzzle: WeatherPuzzle, settings: TierSettings): boolean {
  const analysis = analysePuzzle(puzzle);
  return (
    new Set(puzzle.weather).size >= MIN_DISTINCT_WEATHERS &&
    analysis.best >= readMaxPoints(puzzle) * MIN_BEST_SHARE &&
    analysis.best - analysis.rival >= MIN_MARGIN &&
    analysis.averageShare <= MAX_BLIND_SHARE &&
    (!settings.needsConflict || analysis.greedy < analysis.best)
  );
}

export function generateWeatherPuzzle(seed: number, tier: Difficulty): WeatherPuzzle {
  const settings = TIER_SETTINGS[tier];
  const random = createRandom(hashSeed(seed));
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    const candidate = drawPuzzle(random, settings);
    if (isPuzzleAcceptable(candidate, settings)) {
      return candidate;
    }
  }
  throw new Error(`No ${tier} Weather Window found for seed ${seed}`);
}
