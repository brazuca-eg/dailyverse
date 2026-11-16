import type { Cell, TentsClues } from "./types";

const ORTHOGONAL: readonly (readonly [number, number])[] = [
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1],
];

const DIAGONAL: readonly (readonly [number, number])[] = [
  [-1, -1],
  [-1, 1],
  [1, -1],
  [1, 1],
];

export function toIndex(size: number, cell: Cell): number {
  return cell.row * size + cell.col;
}

export function toCell(size: number, index: number): Cell {
  return { row: Math.floor(index / size), col: index % size };
}

export function isInside(size: number, cell: Cell): boolean {
  return cell.row >= 0 && cell.row < size && cell.col >= 0 && cell.col < size;
}

function listAround(
  size: number,
  cell: Cell,
  offsets: readonly (readonly [number, number])[],
): Cell[] {
  return offsets
    .map(([dRow, dCol]) => ({ row: cell.row + dRow, col: cell.col + dCol }))
    .filter((neighbour) => isInside(size, neighbour));
}

export function listOrthogonalNeighbours(size: number, cell: Cell): Cell[] {
  return listAround(size, cell, ORTHOGONAL);
}

export function listAllNeighbours(size: number, cell: Cell): Cell[] {
  return listAround(size, cell, [...ORTHOGONAL, ...DIAGONAL]);
}

export function sortCells(cells: readonly Cell[]): Cell[] {
  return [...cells].sort((a, b) => a.row - b.row || a.col - b.col);
}

function countIn(values: readonly number[], size: number): number[] {
  return Array.from(
    { length: size },
    (_, index) => values.filter((value) => value === index).length,
  );
}

function haveSameCounts(actual: readonly number[], expected: readonly number[]): boolean {
  return (
    actual.length === expected.length && actual.every((value, index) => value === expected[index])
  );
}

function touchesAnother(size: number, tents: readonly Cell[]): boolean {
  const occupied = new Set(tents.map((tent) => toIndex(size, tent)));
  return tents.some((tent) =>
    listAllNeighbours(size, tent).some((neighbour) => occupied.has(toIndex(size, neighbour))),
  );
}

function canMatchEveryTent(size: number, trees: readonly Cell[], tents: readonly Cell[]): boolean {
  const treeIndexes = new Set(trees.map((tree) => toIndex(size, tree)));
  const options = tents.map((tent) =>
    listOrthogonalNeighbours(size, tent)
      .map((neighbour) => toIndex(size, neighbour))
      .filter((index) => treeIndexes.has(index)),
  );
  const owner = new Map<number, number>();
  const assign = (tent: number, visited: Set<number>): boolean =>
    options[tent].some((tree) => {
      if (visited.has(tree)) {
        return false;
      }
      visited.add(tree);
      const current = owner.get(tree);
      if (current === undefined || assign(current, visited)) {
        owner.set(tree, tent);
        return true;
      }
      return false;
    });
  return tents.every((_, tent) => assign(tent, new Set()));
}

export function isValidSolution(clues: TentsClues, tents: readonly Cell[]): boolean {
  const { size, trees, rowCounts, colCounts } = clues;
  const treeIndexes = new Set(trees.map((tree) => toIndex(size, tree)));
  const tentIndexes = tents.map((tent) => toIndex(size, tent));
  return (
    tents.every((tent) => isInside(size, tent)) &&
    new Set(tentIndexes).size === tents.length &&
    tentIndexes.every((index) => !treeIndexes.has(index)) &&
    tents.length === trees.length &&
    haveSameCounts(
      countIn(
        tents.map((tent) => tent.row),
        size,
      ),
      rowCounts,
    ) &&
    haveSameCounts(
      countIn(
        tents.map((tent) => tent.col),
        size,
      ),
      colCounts,
    ) &&
    !touchesAnother(size, tents) &&
    canMatchEveryTent(size, trees, tents)
  );
}
