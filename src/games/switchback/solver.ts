import { listNeighbours, toEdgeKey } from "./grid";
import type { SwitchbackPuzzle } from "./types";

interface Search {
  size: number;
  cells: number;
  open: number[][];
  markOrder: Int16Array;
  lastMark: number;
  endCell: number;
  visited: Uint8Array;
  path: number[];
  limit: number;
  found: number[][];
}

function buildOpenNeighbours(puzzle: SwitchbackPuzzle): number[][] {
  const blocked = new Set(puzzle.walls.map(([first, second]) => toEdgeKey(first, second)));
  return Array.from({ length: puzzle.size * puzzle.size }, (_, index) =>
    listNeighbours(puzzle.size, index).filter((other) => !blocked.has(toEdgeKey(index, other))),
  );
}

function isStillSolvable(search: Search, head: number): boolean {
  const { open, visited, cells } = search;
  const unvisited = cells - search.path.length;
  if (unvisited === 0) {
    return true;
  }
  const seen = new Uint8Array(cells);
  const stack = [head];
  seen[head] = 1;
  let reached = 0;
  while (stack.length > 0) {
    const current = stack.pop() as number;
    open[current].forEach((next) => {
      if (visited[next] === 0 && seen[next] === 0) {
        seen[next] = 1;
        reached += 1;
        stack.push(next);
      }
    });
  }
  if (reached !== unvisited) {
    return false;
  }
  return Array.from({ length: cells }, (_, cell) => cell).every((cell) => {
    if (visited[cell] === 1) {
      return true;
    }
    const links = open[cell].filter((next) => visited[next] === 0 || next === head).length;
    return cell === search.endCell ? links >= 1 : links >= 2;
  });
}

function explore(search: Search, head: number, nextMark: number): void {
  if (search.path.length === search.cells) {
    search.found.push([...search.path]);
    return;
  }
  search.open[head].forEach((next) => {
    if (search.found.length >= search.limit || search.visited[next] === 1) {
      return;
    }
    const mark = search.markOrder[next];
    const isAllowed =
      mark === -1 ||
      (mark === nextMark && (mark !== search.lastMark || search.path.length === search.cells - 1));
    if (!isAllowed) {
      return;
    }
    search.visited[next] = 1;
    search.path.push(next);
    if (isStillSolvable(search, next)) {
      explore(search, next, mark === -1 ? nextMark : nextMark + 1);
    }
    search.path.pop();
    search.visited[next] = 0;
  });
}

export function listSolutions(puzzle: SwitchbackPuzzle, limit = 2): number[][] {
  const cells = puzzle.size * puzzle.size;
  const markOrder = new Int16Array(cells).fill(-1);
  puzzle.marks.forEach((cell, order) => {
    markOrder[cell] = order;
  });
  const start = puzzle.marks[0];
  const search: Search = {
    size: puzzle.size,
    cells,
    open: buildOpenNeighbours(puzzle),
    markOrder,
    lastMark: puzzle.marks.length - 1,
    endCell: puzzle.marks[puzzle.marks.length - 1],
    visited: new Uint8Array(cells),
    path: [start],
    limit,
    found: [],
  };
  search.visited[start] = 1;
  if (isStillSolvable(search, start)) {
    explore(search, start, 1);
  }
  return search.found;
}

export function countSolutions(puzzle: SwitchbackPuzzle, limit = 2): number {
  return listSolutions(puzzle, limit).length;
}

export function findSolution(puzzle: SwitchbackPuzzle): number[] | null {
  return listSolutions(puzzle, 1)[0] ?? null;
}
