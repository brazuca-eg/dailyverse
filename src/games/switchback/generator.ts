import type { Difficulty } from "../../core/difficulty";
import { createRandom, hashSeed, shuffle, type Random } from "../../core/random";
import { toEdgeKey } from "./grid";
import { randomHamiltonianPath } from "./pathgen";
import { countSolutions, listSolutions } from "./solver";
import { TIER_SETTINGS } from "./tiers";
import type { SwitchbackPuzzle, Wall } from "./types";

export const MAX_ATTEMPTS = 60;
export const MAX_ADDITIONS = 300;
const ATTEMPT_STRIDE = 7919;

interface Draft {
  path: readonly number[];
  positions: readonly number[];
  walls: readonly Wall[];
}

function buildPuzzle(size: number, draft: Draft): SwitchbackPuzzle {
  const marks = [...draft.positions].sort((a, b) => a - b).map((position) => draft.path[position]);
  return { size, marks, walls: draft.walls };
}

function pickOne<T>(items: readonly T[], random: Random): T {
  return items[Math.floor(random() * items.length)];
}

function listPathEdges(path: readonly number[]): Set<string> {
  return new Set(path.slice(1).map((cell, step) => toEdgeKey(path[step], cell)));
}

function listWallCandidates(draft: Draft, alternative: readonly number[]): Wall[] {
  const pathEdges = listPathEdges(draft.path);
  const existing = new Set(draft.walls.map(([first, second]) => toEdgeKey(first, second)));
  return alternative
    .slice(1)
    .map((cell, step): Wall => [alternative[step], cell])
    .filter(([first, second]) => {
      const key = toEdgeKey(first, second);
      return !pathEdges.has(key) && !existing.has(key);
    });
}

function addConstraint(
  draft: Draft,
  alternative: readonly number[],
  wallChance: number,
  random: Random,
): Draft | null {
  const walls = listWallCandidates(draft, alternative);
  const marked = new Set(draft.positions);
  const positions = draft.path
    .map((_, position) => position)
    .filter((position) => position > 0 && position < draft.path.length - 1)
    .filter((position) => !marked.has(position) && draft.path[position] !== alternative[position]);
  if (walls.length > 0 && (random() < wallChance || positions.length === 0)) {
    return { ...draft, walls: [...draft.walls, pickOne(walls, random)] };
  }
  if (positions.length > 0) {
    return { ...draft, positions: [...draft.positions, pickOne(positions, random)] };
  }
  return null;
}

function makeUnique(size: number, start: Draft, wallChance: number, random: Random): Draft | null {
  let draft: Draft | null = start;
  for (let step = 0; step < MAX_ADDITIONS && draft !== null; step += 1) {
    const solutions = listSolutions(buildPuzzle(size, draft), 2);
    if (solutions.length === 1) {
      return draft;
    }
    const alternative = solutions.find((solution) => solution.join() !== draft?.path.join());
    draft = alternative ? addConstraint(draft, alternative, wallChance, random) : null;
  }
  return null;
}

function removeUnneeded(size: number, unique: Draft, random: Random): Draft {
  const lastPosition = unique.path.length - 1;
  const markable = shuffle(
    unique.positions.filter((position) => position !== 0 && position !== lastPosition),
    random,
  );
  const withoutMarks = markable.reduce((draft, position) => {
    const trial = { ...draft, positions: draft.positions.filter((other) => other !== position) };
    return countSolutions(buildPuzzle(size, trial), 2) === 1 ? trial : draft;
  }, unique);
  return shuffle([...withoutMarks.walls], random).reduce((draft, wall) => {
    const trial = { ...draft, walls: draft.walls.filter((other) => other !== wall) };
    return countSolutions(buildPuzzle(size, trial), 2) === 1 ? trial : draft;
  }, withoutMarks);
}

function tryGenerate(seed: number, tier: Difficulty, attempt: number): SwitchbackPuzzle | null {
  const settings = TIER_SETTINGS[tier];
  const random = createRandom(hashSeed(seed + attempt * ATTEMPT_STRIDE));
  const path = randomHamiltonianPath(settings.size, random);
  const start: Draft = { path, positions: [0, path.length - 1], walls: [] };
  const unique = makeUnique(settings.size, start, settings.wallChance, random);
  if (unique === null) {
    return null;
  }
  const puzzle = buildPuzzle(settings.size, removeUnneeded(settings.size, unique, random));
  const fits =
    puzzle.marks.length >= settings.minMarks &&
    puzzle.marks.length <= settings.maxMarks &&
    puzzle.walls.length >= settings.minWalls &&
    puzzle.walls.length <= settings.maxWalls;
  return fits ? puzzle : null;
}

export function generateSwitchback(seed: number, tier: Difficulty): SwitchbackPuzzle {
  const attempts = Array.from({ length: MAX_ATTEMPTS }, (_, attempt) => attempt);
  const puzzle = attempts.reduce<SwitchbackPuzzle | null>(
    (found, attempt) => found ?? tryGenerate(seed, tier, attempt),
    null,
  );
  if (puzzle === null) {
    throw new Error(`No ${tier} Switchback could be generated for seed ${seed}`);
  }
  return puzzle;
}
