import { FALLBACK_ORDER, WEEKLY_DIFFICULTY_PATTERN, type Difficulty } from "../../core/difficulty";
import { createRandom, shuffle } from "../../core/random";
import type { FlagEntry } from "./types";

export const SCHEDULE_SEED = 2026;

type Pools = Record<Difficulty, FlagEntry[]>;

function groupByDifficulty(entries: readonly FlagEntry[], random: () => number): Pools {
  return {
    easy: shuffle(
      entries.filter((entry) => entry.difficulty === "easy"),
      random,
    ),
    medium: shuffle(
      entries.filter((entry) => entry.difficulty === "medium"),
      random,
    ),
    hard: shuffle(
      entries.filter((entry) => entry.difficulty === "hard"),
      random,
    ),
  };
}

function takeNext(pools: Pools, wanted: Difficulty): FlagEntry | undefined {
  const tier = FALLBACK_ORDER[wanted].find((candidate) => pools[candidate].length > 0);
  return tier ? pools[tier].shift() : undefined;
}

export function buildFlagSchedule(entries: readonly FlagEntry[], seed: number): FlagEntry[] {
  const pools = groupByDifficulty(entries, createRandom(seed));
  return entries.flatMap((_, index) => {
    const next = takeNext(
      pools,
      WEEKLY_DIFFICULTY_PATTERN[index % WEEKLY_DIFFICULTY_PATTERN.length],
    );
    return next ? [next] : [];
  });
}
