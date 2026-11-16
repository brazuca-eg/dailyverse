import {
  isValidSolution,
  listAllNeighbours,
  listOrthogonalNeighbours,
  toCell,
  toIndex,
} from "./rules";
import type { Cell, TentsClues } from "./types";

const UNKNOWN = 0;
const TENT = 1;
const GRASS = 2;
const TREE = 3;

type Grid = Int8Array;

export interface LogicResult {
  solved: boolean;
  lookaheads: number;
  tents: Cell[];
}

interface Context {
  clues: TentsClues;
  orthogonal: number[][];
  around: number[][];
  lines: { cells: number[]; target: number }[];
  treeCells: number[];
}

function createContext(clues: TentsClues): Context {
  const { size } = clues;
  const cells = Array.from({ length: size * size }, (_, index) => toCell(size, index));
  const toIndexes = (list: Cell[]) => list.map((cell) => toIndex(size, cell));
  const rows = Array.from({ length: size }, (_, row) => ({
    cells: cells.filter((cell) => cell.row === row).map((cell) => toIndex(size, cell)),
    target: clues.rowCounts[row],
  }));
  const cols = Array.from({ length: size }, (_, col) => ({
    cells: cells.filter((cell) => cell.col === col).map((cell) => toIndex(size, cell)),
    target: clues.colCounts[col],
  }));
  return {
    clues,
    orthogonal: cells.map((cell) => toIndexes(listOrthogonalNeighbours(size, cell))),
    around: cells.map((cell) => toIndexes(listAllNeighbours(size, cell))),
    lines: [...rows, ...cols],
    treeCells: clues.trees.map((tree) => toIndex(size, tree)),
  };
}

function createGrid(context: Context): Grid {
  const grid = new Int8Array(context.clues.size * context.clues.size);
  context.treeCells.forEach((index) => {
    grid[index] = TREE;
  });
  return grid;
}

function setCell(grid: Grid, index: number, value: number): boolean {
  if (grid[index] === UNKNOWN) {
    grid[index] = value;
    return true;
  }
  return false;
}

function applyIsolationAndTents(grid: Grid, context: Context): { changed: boolean; ok: boolean } {
  let changed = false;
  let ok = true;
  grid.forEach((value, index) => {
    if (value === UNKNOWN && !context.orthogonal[index].some((near) => grid[near] === TREE)) {
      changed = setCell(grid, index, GRASS) || changed;
    }
    if (value === TENT) {
      context.around[index].forEach((near) => {
        if (grid[near] === TENT) {
          ok = false;
        }
        changed = setCell(grid, near, GRASS) || changed;
      });
    }
  });
  return { changed, ok };
}

function applyLineCounts(grid: Grid, context: Context): { changed: boolean; ok: boolean } {
  let changed = false;
  let ok = true;
  context.lines.forEach((line) => {
    const tents = line.cells.filter((index) => grid[index] === TENT).length;
    const unknown = line.cells.filter((index) => grid[index] === UNKNOWN);
    if (tents > line.target || tents + unknown.length < line.target) {
      ok = false;
    } else if (tents === line.target) {
      unknown.forEach((index) => {
        changed = setCell(grid, index, GRASS) || changed;
      });
    } else if (tents + unknown.length === line.target) {
      unknown.forEach((index) => {
        changed = setCell(grid, index, TENT) || changed;
      });
    }
  });
  return { changed, ok };
}

function listCandidates(grid: Grid, context: Context, tree: number): number[] {
  return context.orthogonal[tree].filter(
    (index) => grid[index] === UNKNOWN || grid[index] === TENT,
  );
}

function applyTreeRules(grid: Grid, context: Context): { changed: boolean; ok: boolean } {
  let changed = false;
  let ok = true;
  context.treeCells.forEach((tree) => {
    const candidates = listCandidates(grid, context, tree);
    if (candidates.length === 0) {
      ok = false;
    } else if (candidates.length === 1) {
      changed = setCell(grid, candidates[0], TENT) || changed;
    } else {
      context.around[candidates[0]]
        .filter((index) =>
          candidates.every((candidate) => context.around[candidate].includes(index)),
        )
        .forEach((index) => {
          changed = setCell(grid, index, GRASS) || changed;
        });
    }
  });
  return { changed, ok };
}

function readTents(grid: Grid, size: number): Cell[] {
  return Array.from(grid)
    .map((value, index) => (value === TENT ? toCell(size, index) : null))
    .filter((cell): cell is Cell => cell !== null);
}

function propagate(grid: Grid, context: Context): boolean {
  let progress = true;
  while (progress) {
    const steps = [applyIsolationAndTents, applyLineCounts, applyTreeRules].map((step) =>
      step(grid, context),
    );
    if (steps.some((step) => !step.ok)) {
      return false;
    }
    progress = steps.some((step) => step.changed);
  }
  const isFinished = !grid.includes(UNKNOWN);
  return !isFinished || isValidSolution(context.clues, readTents(grid, context.clues.size));
}

function tryAssumption(grid: Grid, context: Context, index: number, value: number): boolean {
  const copy = Int8Array.from(grid);
  copy[index] = value;
  return propagate(copy, context);
}

function lookOnce(grid: Grid, context: Context): "deduced" | "stuck" | "broken" {
  const unknown = Array.from(grid)
    .map((value, index) => (value === UNKNOWN ? index : -1))
    .filter((index) => index >= 0);
  const forced = unknown
    .flatMap((index) => [
      { index, value: GRASS, impossible: !tryAssumption(grid, context, index, TENT) },
      { index, value: TENT, impossible: !tryAssumption(grid, context, index, GRASS) },
    ])
    .find((candidate) => candidate.impossible);
  if (!forced) {
    return "stuck";
  }
  grid[forced.index] = forced.value;
  return propagate(grid, context) ? "deduced" : "broken";
}

export function solveByLogic(clues: TentsClues): LogicResult {
  const context = createContext(clues);
  const grid = createGrid(context);
  let lookaheads = 0;
  let state: "deduced" | "stuck" | "broken" = propagate(grid, context) ? "deduced" : "broken";
  while (state === "deduced" && grid.includes(UNKNOWN)) {
    state = lookOnce(grid, context);
    lookaheads += state === "deduced" ? 1 : 0;
  }
  const finished = state !== "broken" && !grid.includes(UNKNOWN);
  return {
    solved: finished,
    lookaheads,
    tents: finished ? readTents(grid, clues.size) : [],
  };
}
