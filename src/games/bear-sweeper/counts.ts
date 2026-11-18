import { readNeighbours } from "./grid";
import type { BearPuzzle } from "./types";

export function countAdjacentBears(puzzle: BearPuzzle): number[] {
  const bears = new Set(puzzle.bears);
  return readNeighbours(puzzle.size).map(
    (neighbours) => neighbours.filter((neighbour) => bears.has(neighbour)).length,
  );
}

export function floodReveal(
  puzzle: BearPuzzle,
  counts: readonly number[],
  from: number,
  isRevealed: (index: number) => boolean,
): number[] {
  const bears = new Set(puzzle.bears);
  const neighbours = readNeighbours(puzzle.size);
  const found = new Set<number>();
  const stack = [from];
  while (stack.length > 0) {
    const current = stack.pop() as number;
    if (!found.has(current) && !isRevealed(current) && !bears.has(current)) {
      found.add(current);
      if (counts[current] === 0) {
        neighbours[current].forEach((next) => stack.push(next));
      }
    }
  }
  return [...found];
}

export function listStartCells(puzzle: BearPuzzle): number[] {
  return floodReveal(puzzle, countAdjacentBears(puzzle), puzzle.start, () => false);
}
