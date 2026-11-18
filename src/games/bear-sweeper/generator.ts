import type { Difficulty } from "../../core/difficulty";
import { createRandom, hashSeed, shuffle } from "../../core/random";
import { listStartCells } from "./counts";
import { readNeighbours } from "./grid";
import { solveByLogic } from "./logic";
import { TIER_SETTINGS } from "./tiers";
import type { BearPuzzle } from "./types";

export const MAX_ATTEMPTS = 400;
const ATTEMPT_STRIDE = 7919;

function tryGenerate(seed: number, tier: Difficulty, attempt: number): BearPuzzle | null {
  const { size, bears, minLevel, maxLevel, maxOpenShare } = TIER_SETTINGS[tier];
  const random = createRandom(hashSeed(seed + attempt * ATTEMPT_STRIDE));
  const cells = size * size;
  const start = Math.floor(random() * cells);
  const blocked = new Set([start, ...readNeighbours(size)[start]]);
  const candidates = Array.from({ length: cells }, (_, index) => index).filter(
    (index) => !blocked.has(index),
  );
  const chosen = shuffle(candidates, random)
    .slice(0, bears)
    .sort((a, b) => a - b);
  const puzzle: BearPuzzle = { size, bears: chosen, start };
  const opened = listStartCells(puzzle).length;
  if (opened / (cells - bears) > maxOpenShare) {
    return null;
  }
  const result = solveByLogic(puzzle, maxLevel);
  const fits =
    result.solved &&
    result.mistakes === 0 &&
    result.hardest >= minLevel &&
    result.hardest <= maxLevel;
  return fits ? puzzle : null;
}

export function generateBearPuzzle(seed: number, tier: Difficulty): BearPuzzle {
  const attempts = Array.from({ length: MAX_ATTEMPTS }, (_, attempt) => attempt);
  const puzzle = attempts.reduce<BearPuzzle | null>(
    (found, attempt) => found ?? tryGenerate(seed, tier, attempt),
    null,
  );
  if (puzzle === null) {
    throw new Error(`No ${tier} Bear Sweeper could be generated for seed ${seed}`);
  }
  return puzzle;
}
