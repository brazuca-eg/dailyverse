import { isInside, listAllNeighbours, listOrthogonalNeighbours, toCell, toIndex } from "./rules";
import type { Cell, TentsClues } from "./types";

export interface SolveResult {
  count: number;
  solutions: Cell[][];
}

interface Search {
  size: number;
  rowCounts: readonly number[];
  colCounts: readonly number[];
  treeIndexes: ReadonlySet<number>;
  options: ReadonlyMap<number, readonly number[]>;
  rowUsed: number[];
  colUsed: number[];
  blocked: number[];
  taken: Set<number>;
  found: Map<string, number[]>;
  limit: number;
}

function createSearch(clues: TentsClues, limit: number): Search {
  const { size, trees } = clues;
  const treeIndexes = new Set(trees.map((tree) => toIndex(size, tree)));
  const options = new Map(
    trees.map((tree) => [
      toIndex(size, tree),
      listOrthogonalNeighbours(size, tree)
        .map((neighbour) => toIndex(size, neighbour))
        .filter((index) => !treeIndexes.has(index)),
    ]),
  );
  return {
    size,
    rowCounts: clues.rowCounts,
    colCounts: clues.colCounts,
    treeIndexes,
    options,
    rowUsed: Array.from({ length: size }, () => 0),
    colUsed: Array.from({ length: size }, () => 0),
    blocked: Array.from({ length: size * size }, () => 0),
    taken: new Set(),
    found: new Map(),
    limit,
  };
}

function isAllowed(search: Search, index: number): boolean {
  const { row, col } = toCell(search.size, index);
  return (
    !search.taken.has(index) &&
    search.blocked[index] === 0 &&
    search.rowUsed[row] < search.rowCounts[row] &&
    search.colUsed[col] < search.colCounts[col]
  );
}

function shift(search: Search, index: number, delta: number): void {
  const cell = toCell(search.size, index);
  search.rowUsed[cell.row] += delta;
  search.colUsed[cell.col] += delta;
  listAllNeighbours(search.size, cell).forEach((neighbour) => {
    search.blocked[toIndex(search.size, neighbour)] += delta;
  });
}

function canStillFillLines(search: Search, open: ReadonlyMap<number, number[]>): boolean {
  const rowSupply = Array.from({ length: search.size }, () => 0);
  const colSupply = Array.from({ length: search.size }, () => 0);
  open.forEach((cells) => {
    new Set(cells.map((index) => toCell(search.size, index).row)).forEach((row) => {
      rowSupply[row] += 1;
    });
    new Set(cells.map((index) => toCell(search.size, index).col)).forEach((col) => {
      colSupply[col] += 1;
    });
  });
  return (
    rowSupply.every((supply, row) => supply >= search.rowCounts[row] - search.rowUsed[row]) &&
    colSupply.every((supply, col) => supply >= search.colCounts[col] - search.colUsed[col])
  );
}

function isComplete(search: Search): boolean {
  return (
    search.rowUsed.every((used, row) => used === search.rowCounts[row]) &&
    search.colUsed.every((used, col) => used === search.colCounts[col])
  );
}

function explore(search: Search, remaining: readonly number[]): void {
  if (remaining.length === 0) {
    if (isComplete(search)) {
      const tents = [...search.taken].sort((a, b) => a - b);
      search.found.set(tents.join(","), tents);
    }
    return;
  }
  const open = new Map(
    remaining.map((tree) => [
      tree,
      (search.options.get(tree) ?? []).filter((index) => isAllowed(search, index)),
    ]),
  );
  const tightest = [...open.entries()].sort((a, b) => a[1].length - b[1].length)[0];
  if (tightest[1].length === 0 || !canStillFillLines(search, open)) {
    return;
  }
  const [tree, candidates] = tightest;
  const others = remaining.filter((candidate) => candidate !== tree);
  candidates.every((index) => {
    search.taken.add(index);
    shift(search, index, 1);
    explore(search, others);
    shift(search, index, -1);
    search.taken.delete(index);
    return search.found.size < search.limit;
  });
}

export function solve(clues: TentsClues, limit = 2): SolveResult {
  const search = createSearch(clues, limit);
  const total = clues.rowCounts.reduce((sum, count) => sum + count, 0);
  if (total === clues.trees.length && clues.trees.every((tree) => isInside(clues.size, tree))) {
    explore(
      search,
      clues.trees.map((tree) => toIndex(clues.size, tree)),
    );
  }
  const solutions = [...search.found.values()].map((tents) =>
    tents.map((index) => toCell(clues.size, index)),
  );
  return { count: solutions.length, solutions };
}
