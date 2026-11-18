import { readNeighbours } from "./grid";
import { countAdjacentBears, listStartCells } from "./counts";
import type { BearPuzzle } from "./types";

export const LEVEL_SINGLE = 1;
export const LEVEL_SUBSET = 2;
export const LEVEL_ADVANCED = 3;

export interface LogicResult {
  solved: boolean;
  hardest: number;
  mistakes: number;
}

export interface Knowledge {
  size: number;
  total: number;
  counts: readonly number[];
  neighbours: number[][];
  revealed: Uint8Array;
  bear: Uint8Array;
  safe: Uint8Array;
}

function isOpen(knowledge: Knowledge, cell: number): boolean {
  return knowledge.revealed[cell] === 0 && knowledge.bear[cell] === 0 && knowledge.safe[cell] === 0;
}

function readNeed(knowledge: Knowledge, cell: number): { need: number; open: number[] } {
  const known = knowledge.neighbours[cell].filter((next) => knowledge.bear[next] === 1).length;
  return {
    need: knowledge.counts[cell] - known,
    open: knowledge.neighbours[cell].filter((next) => isOpen(knowledge, next)),
  };
}

function listNumberCells(knowledge: Knowledge): number[] {
  return Array.from({ length: knowledge.counts.length }, (_, cell) => cell).filter(
    (cell) => knowledge.revealed[cell] === 1 && knowledge.counts[cell] > 0,
  );
}

function applySingles(knowledge: Knowledge): boolean {
  let changed = false;
  listNumberCells(knowledge).forEach((cell) => {
    const { need, open } = readNeed(knowledge, cell);
    if (open.length > 0 && need === 0) {
      open.forEach((next) => {
        knowledge.safe[next] = 1;
      });
      changed = true;
    } else if (open.length > 0 && need === open.length) {
      open.forEach((next) => {
        knowledge.bear[next] = 1;
      });
      changed = true;
    }
  });
  return changed;
}

function applySubsets(knowledge: Knowledge): boolean {
  let changed = false;
  const cells = listNumberCells(knowledge);
  const needs = new Map(cells.map((cell) => [cell, readNeed(knowledge, cell)]));
  cells.forEach((first) => {
    const a = needs.get(first) as { need: number; open: number[] };
    cells.forEach((second) => {
      const b = needs.get(second) as { need: number; open: number[] };
      const isSubset =
        first !== second &&
        a.open.length > 0 &&
        a.open.length < b.open.length &&
        a.open.every((next) => b.open.includes(next));
      if (isSubset) {
        const rest = b.open.filter((next) => !a.open.includes(next));
        const extra = b.need - a.need;
        if (extra === 0) {
          rest.forEach((next) => {
            knowledge.safe[next] = 1;
          });
          changed = true;
        } else if (extra === rest.length) {
          rest.forEach((next) => {
            knowledge.bear[next] = 1;
          });
          changed = true;
        }
      }
    });
  });
  return changed;
}

function countKnownBears(knowledge: Knowledge): number {
  return knowledge.bear.reduce((sum, value) => sum + value, 0);
}

function applyGlobalCount(knowledge: Knowledge): boolean {
  const open = Array.from({ length: knowledge.counts.length }, (_, cell) => cell).filter((cell) =>
    isOpen(knowledge, cell),
  );
  const left = knowledge.total - countKnownBears(knowledge);
  if (open.length === 0) {
    return false;
  }
  if (left === 0) {
    open.forEach((cell) => {
      knowledge.safe[cell] = 1;
    });
    return true;
  }
  if (left === open.length) {
    open.forEach((cell) => {
      knowledge.bear[cell] = 1;
    });
    return true;
  }
  return false;
}

function isContradiction(knowledge: Knowledge): boolean {
  return listNumberCells(knowledge).some((cell) => {
    const { need, open } = readNeed(knowledge, cell);
    return need < 0 || need > open.length;
  });
}

function copyKnowledge(knowledge: Knowledge): Knowledge {
  return { ...knowledge, bear: knowledge.bear.slice(), safe: knowledge.safe.slice() };
}

function propagateUntilStable(knowledge: Knowledge): boolean {
  let guard = 0;
  while (guard < 60) {
    if (isContradiction(knowledge)) {
      return true;
    }
    if (!applySingles(knowledge)) {
      return isContradiction(knowledge);
    }
    guard += 1;
  }
  return false;
}

function listFrontier(knowledge: Knowledge): number[] {
  const frontier = new Set<number>();
  listNumberCells(knowledge).forEach((cell) => {
    knowledge.neighbours[cell].forEach((next) => {
      if (isOpen(knowledge, next)) {
        frontier.add(next);
      }
    });
  });
  return [...frontier];
}

function applyLookahead(knowledge: Knowledge): boolean {
  let changed = false;
  listFrontier(knowledge).forEach((cell) => {
    if (isOpen(knowledge, cell)) {
      const asBear = copyKnowledge(knowledge);
      asBear.bear[cell] = 1;
      if (propagateUntilStable(asBear)) {
        knowledge.safe[cell] = 1;
        changed = true;
      } else {
        const asSafe = copyKnowledge(knowledge);
        asSafe.safe[cell] = 1;
        if (propagateUntilStable(asSafe)) {
          knowledge.bear[cell] = 1;
          changed = true;
        }
      }
    }
  });
  return changed;
}

function listFlood(knowledge: Knowledge, from: number): number[] {
  const found = new Set<number>();
  const stack = [from];
  while (stack.length > 0) {
    const current = stack.pop() as number;
    if (!found.has(current) && knowledge.revealed[current] === 0) {
      found.add(current);
      if (knowledge.counts[current] === 0) {
        knowledge.neighbours[current].forEach((next) => stack.push(next));
      }
    }
  }
  return [...found];
}

function listPendingSafe(knowledge: Knowledge): number[] {
  return Array.from({ length: knowledge.counts.length }, (_, cell) => cell).filter(
    (cell) => knowledge.safe[cell] === 1 && knowledge.revealed[cell] === 0,
  );
}

function revealSafe(knowledge: Knowledge): boolean {
  const pending = listPendingSafe(knowledge);
  pending.forEach((cell) => {
    listFlood(knowledge, cell).forEach((next) => {
      knowledge.revealed[next] = 1;
      knowledge.safe[next] = 0;
    });
  });
  return pending.length > 0;
}

export interface Technique {
  name: string;
  level: number;
  apply: (knowledge: Knowledge) => boolean;
}

export const TECHNIQUES: readonly Technique[] = [
  { name: "single", level: LEVEL_SINGLE, apply: applySingles },
  { name: "subset", level: LEVEL_SUBSET, apply: applySubsets },
  { name: "global-count", level: LEVEL_ADVANCED, apply: applyGlobalCount },
  { name: "lookahead", level: LEVEL_ADVANCED, apply: applyLookahead },
];

export function buildKnowledge(
  puzzle: BearPuzzle,
  revealedCells: readonly number[],
  knownBears: readonly number[],
): Knowledge {
  const cells = puzzle.size * puzzle.size;
  const knowledge: Knowledge = {
    size: puzzle.size,
    total: puzzle.bears.length,
    counts: countAdjacentBears(puzzle),
    neighbours: readNeighbours(puzzle.size),
    revealed: new Uint8Array(cells),
    bear: new Uint8Array(cells),
    safe: new Uint8Array(cells),
  };
  revealedCells.forEach((cell) => {
    knowledge.revealed[cell] = 1;
  });
  knownBears.forEach((cell) => {
    knowledge.bear[cell] = 1;
  });
  revealedCells
    .filter((cell) => knowledge.counts[cell] === 0)
    .forEach((cell) => {
      knowledge.neighbours[cell]
        .filter((next) => knowledge.revealed[next] === 0)
        .forEach((next) => {
          knowledge.safe[next] = 1;
        });
    });
  return knowledge;
}

function isFinished(knowledge: Knowledge): boolean {
  return Array.from({ length: knowledge.counts.length }, (_, cell) => cell).every(
    (cell) => knowledge.revealed[cell] === 1 || knowledge.bear[cell] === 1,
  );
}

function countMistakes(knowledge: Knowledge, puzzle: BearPuzzle): number {
  const bears = new Set(puzzle.bears);
  return Array.from({ length: knowledge.counts.length }, (_, cell) => cell).filter(
    (cell) =>
      (knowledge.bear[cell] === 1 && !bears.has(cell)) ||
      (knowledge.revealed[cell] === 1 && bears.has(cell)),
  ).length;
}

export function solveByLogic(
  puzzle: BearPuzzle,
  maxLevel = LEVEL_ADVANCED,
  techniques: readonly Technique[] = TECHNIQUES,
): LogicResult {
  const knowledge = buildKnowledge(puzzle, listStartCells(puzzle), []);
  let hardest = 0;
  let progressed = true;
  while (progressed && !isFinished(knowledge)) {
    progressed = false;
    if (revealSafe(knowledge)) {
      progressed = true;
    } else {
      const step = techniques
        .filter((candidate) => candidate.level <= maxLevel)
        .find((candidate) => candidate.apply(knowledge));
      if (step) {
        hardest = Math.max(hardest, step.level);
        progressed = true;
      }
    }
  }
  return { solved: isFinished(knowledge), hardest, mistakes: countMistakes(knowledge, puzzle) };
}

export function findDeducedSafeCells(
  puzzle: BearPuzzle,
  revealedCells: readonly number[],
  knownBears: readonly number[],
): number[] {
  const knowledge = buildKnowledge(puzzle, revealedCells, knownBears);
  let progressed = true;
  while (progressed && listPendingSafe(knowledge).length === 0) {
    progressed = TECHNIQUES.some((step) => step.apply(knowledge));
  }
  return listPendingSafe(knowledge);
}
