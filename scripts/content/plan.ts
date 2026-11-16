import {
  FALLBACK_ORDER,
  WEEKLY_DIFFICULTY_PATTERN,
  type Difficulty,
} from "../../src/core/difficulty";
import { createRandom, shuffle } from "../../src/core/random";
import type { Country } from "../../src/core/types";
import { resolveTier } from "./tiers";

export interface PlannedPuzzle {
  country: Country;
  difficulty: Difficulty;
}

function pickNext(
  pools: Record<Difficulty, Country[]>,
  wanted: Difficulty,
  previousContinent: string | undefined,
): PlannedPuzzle | undefined {
  for (const tier of FALLBACK_ORDER[wanted]) {
    const pool = pools[tier];
    if (pool.length > 0) {
      const differentContinent = pool.findIndex(
        (country) => country.continent !== previousContinent,
      );
      const [country] = pool.splice(differentContinent === -1 ? 0 : differentContinent, 1);
      return { country, difficulty: tier };
    }
  }
  return undefined;
}

export function planBatch(
  countries: readonly Country[],
  unavailableCodes: ReadonlySet<string>,
  size: number,
  seed: number,
): PlannedPuzzle[] {
  const random = createRandom(seed);
  const available = countries.filter((country) => !unavailableCodes.has(country.code));
  const pools: Record<Difficulty, Country[]> = {
    easy: shuffle(
      available.filter((country) => resolveTier(country.code) === "easy"),
      random,
    ),
    medium: shuffle(
      available.filter((country) => resolveTier(country.code) === "medium"),
      random,
    ),
    hard: shuffle(
      available.filter((country) => resolveTier(country.code) === "hard"),
      random,
    ),
  };
  const planned: PlannedPuzzle[] = [];
  let previousContinent: string | undefined;
  let exhausted = false;
  while (!exhausted && planned.length < size) {
    const wanted = WEEKLY_DIFFICULTY_PATTERN[planned.length % WEEKLY_DIFFICULTY_PATTERN.length];
    const picked = pickNext(pools, wanted, previousContinent);
    if (picked) {
      planned.push(picked);
      previousContinent = picked.country.continent;
    } else {
      exhausted = true;
    }
  }
  return planned;
}
