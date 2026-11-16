import type { Country } from "../../src/core/types";
import type { Difficulty } from "../../src/games/mystery-place/types";
import { resolveTier } from "./tiers";

export interface PlannedPuzzle {
  country: Country;
  difficulty: Difficulty;
}

const DIFFICULTY_PATTERN: readonly Difficulty[] = [
  "easy",
  "medium",
  "hard",
  "medium",
  "easy",
  "medium",
  "hard",
];

const FALLBACK_ORDER: Readonly<Record<Difficulty, readonly Difficulty[]>> = {
  easy: ["easy", "medium", "hard"],
  medium: ["medium", "hard", "easy"],
  hard: ["hard", "medium", "easy"],
};

function createRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(items: readonly T[], random: () => number): T[] {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
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
    const wanted = DIFFICULTY_PATTERN[planned.length % DIFFICULTY_PATTERN.length];
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
