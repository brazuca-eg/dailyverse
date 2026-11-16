import type { Difficulty } from "../../core/difficulty";
import { createRandom, hashSeed, shuffle, type Random } from "../../core/random";
import { solveByLogic } from "./deduce";
import { TIER_SETTINGS, type TierSettings } from "./difficulty";
import { listOrthogonalNeighbours, sortCells, toCell, toIndex } from "./rules";
import { solve } from "./solver";
import type { Cell, TentsPuzzle } from "./types";

const MAX_ATTEMPTS = 600;
const ATTEMPT_SPREAD = 131;

function placeTents(random: Random, size: number, count: number): Cell[] | null {
  const order = shuffle(
    Array.from({ length: size * size }, (_, index) => toCell(size, index)),
    random,
  );
  const tents = order.reduce<Cell[]>((placed, cell) => {
    const touches = placed.some(
      (tent) => Math.abs(tent.row - cell.row) <= 1 && Math.abs(tent.col - cell.col) <= 1,
    );
    return placed.length < count && !touches ? [...placed, cell] : placed;
  }, []);
  return tents.length === count ? tents : null;
}

function placeTrees(random: Random, size: number, tents: readonly Cell[]): Cell[] | null {
  const tentIndexes = new Set(tents.map((tent) => toIndex(size, tent)));
  const trees: Cell[] = [];
  const treeIndexes = new Set<number>();
  const placedAll = shuffle(tents, random).every((tent) => {
    const free = shuffle(listOrthogonalNeighbours(size, tent), random).find((cell) => {
      const index = toIndex(size, cell);
      return !tentIndexes.has(index) && !treeIndexes.has(index);
    });
    if (!free) {
      return false;
    }
    trees.push(free);
    treeIndexes.add(toIndex(size, free));
    return true;
  });
  return placedAll ? trees : null;
}

function countLine(values: readonly number[], size: number): number[] {
  return Array.from(
    { length: size },
    (_, index) => values.filter((value) => value === index).length,
  );
}

function buildCandidate(random: Random, settings: TierSettings): TentsPuzzle | null {
  const { size } = settings;
  const tents = placeTents(random, size, Math.round(size * size * settings.density));
  const trees = tents ? placeTrees(random, size, tents) : null;
  if (!tents || !trees) {
    return null;
  }
  return {
    size,
    trees: sortCells(trees),
    rowCounts: countLine(
      tents.map((tent) => tent.row),
      size,
    ),
    colCounts: countLine(
      tents.map((tent) => tent.col),
      size,
    ),
    solution: sortCells(tents),
  };
}

function fitsTier(puzzle: TentsPuzzle, settings: TierSettings): boolean {
  if (solve(puzzle, 2).count !== 1) {
    return false;
  }
  const logic = solveByLogic(puzzle);
  return (
    logic.solved &&
    logic.lookaheads >= settings.minLookaheads &&
    logic.lookaheads <= settings.maxLookaheads
  );
}

export function generateTentsPuzzle(seed: number, tier: Difficulty): TentsPuzzle {
  const settings = TIER_SETTINGS[tier];
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    const random = createRandom(hashSeed(seed * ATTEMPT_SPREAD + attempt + 1));
    const candidate = buildCandidate(random, settings);
    if (candidate && fitsTier(candidate, settings)) {
      return candidate;
    }
  }
  throw new Error(`Could not make a ${tier} tents puzzle for seed ${seed}`);
}
