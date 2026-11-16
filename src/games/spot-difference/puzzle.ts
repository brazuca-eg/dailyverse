import type { Difficulty } from "../../core/difficulty";
import { createRandom, hashSeed } from "../../core/random";
import { planDifferences } from "./differences";
import { generateScene } from "./scene";
import type { Puzzle } from "./types";

const MAX_ATTEMPTS = 40;
const ATTEMPT_SPREAD = 101;

export function generatePuzzle(seed: number, tier: Difficulty): Puzzle {
  const original = generateScene(seed);
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    const random = createRandom(hashSeed(seed * ATTEMPT_SPREAD + attempt + 1));
    const plan = planDifferences(original, tier, random);
    if (plan) {
      return { seed, tier, original, altered: plan.altered, differences: plan.differences };
    }
  }
  throw new Error(`Could not place the differences for seed ${seed} at ${tier} difficulty`);
}
