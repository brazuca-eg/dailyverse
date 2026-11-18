import type { GameStatus } from "../../core/guessing";
import { areAdjacent, toEdgeKey } from "./grid";
import type { SwitchbackPuzzle, SwitchbackRound } from "./types";

export const MAX_SCORE = 5;

export interface SwitchbackState {
  puzzleId: string;
  path: number[];
  hints: number;
  elapsedSeconds: number;
  status: GameStatus;
}

export function buildPuzzleId(round: SwitchbackRound): string {
  return `${round.tier}:${round.poolIndex}`;
}

export function createInitialState(puzzleId: string, puzzle: SwitchbackPuzzle): SwitchbackState {
  return { puzzleId, path: [puzzle.marks[0]], hints: 0, elapsedSeconds: 0, status: "playing" };
}

export function countCells(puzzle: SwitchbackPuzzle): number {
  return puzzle.size * puzzle.size;
}

export function countReachedMarks(puzzle: SwitchbackPuzzle, path: readonly number[]): number {
  return puzzle.marks.filter((mark) => path.includes(mark)).length;
}

function isWalled(puzzle: SwitchbackPuzzle, first: number, second: number): boolean {
  const key = toEdgeKey(first, second);
  return puzzle.walls.some(([a, b]) => toEdgeKey(a, b) === key);
}

export function canExtend(
  puzzle: SwitchbackPuzzle,
  path: readonly number[],
  cell: number,
): boolean {
  const head = path[path.length - 1];
  if (
    cell < 0 ||
    cell >= countCells(puzzle) ||
    path.includes(cell) ||
    !areAdjacent(puzzle.size, head, cell) ||
    isWalled(puzzle, head, cell)
  ) {
    return false;
  }
  const mark = puzzle.marks.indexOf(cell);
  if (mark === -1) {
    return true;
  }
  const isLast = mark === puzzle.marks.length - 1;
  return (
    mark === countReachedMarks(puzzle, path) && (!isLast || path.length === countCells(puzzle) - 1)
  );
}

export function isComplete(puzzle: SwitchbackPuzzle, path: readonly number[]): boolean {
  return (
    path.length === countCells(puzzle) &&
    path[path.length - 1] === puzzle.marks[puzzle.marks.length - 1]
  );
}

function withPath(
  state: SwitchbackState,
  puzzle: SwitchbackPuzzle,
  path: number[],
): SwitchbackState {
  return { ...state, path, status: isComplete(puzzle, path) ? "won" : "playing" };
}

export function moveTo(
  state: SwitchbackState,
  puzzle: SwitchbackPuzzle,
  cell: number,
): SwitchbackState {
  if (state.status !== "playing") {
    return state;
  }
  const at = state.path.indexOf(cell);
  if (at !== -1) {
    return at === state.path.length - 1
      ? state
      : withPath(state, puzzle, state.path.slice(0, at + 1));
  }
  return canExtend(puzzle, state.path, cell)
    ? withPath(state, puzzle, [...state.path, cell])
    : state;
}

export function undoStep(state: SwitchbackState, puzzle: SwitchbackPuzzle): SwitchbackState {
  if (state.status !== "playing" || state.path.length <= 1) {
    return state;
  }
  return withPath(state, puzzle, state.path.slice(0, -1));
}

export function resetPath(state: SwitchbackState, puzzle: SwitchbackPuzzle): SwitchbackState {
  if (state.status !== "playing" || state.path.length <= 1) {
    return state;
  }
  return withPath(state, puzzle, [puzzle.marks[0]]);
}

export function countSharedSteps(path: readonly number[], solution: readonly number[]): number {
  const firstDifference = path.findIndex((cell, step) => cell !== solution[step]);
  return firstDifference === -1 ? path.length : firstDifference;
}

export function giveHint(
  state: SwitchbackState,
  puzzle: SwitchbackPuzzle,
  solution: readonly number[],
): SwitchbackState {
  const shared = countSharedSteps(state.path, solution);
  if (state.status !== "playing" || shared >= solution.length) {
    return state;
  }
  const hinted = withPath(state, puzzle, solution.slice(0, shared + 1));
  return { ...hinted, hints: hinted.hints + 1 };
}

export function giveUp(state: SwitchbackState): SwitchbackState {
  return state.status === "playing" ? { ...state, status: "lost" } : state;
}

export function addElapsed(state: SwitchbackState, seconds: number): SwitchbackState {
  return state.status === "playing"
    ? { ...state, elapsedSeconds: state.elapsedSeconds + seconds }
    : state;
}

export function calculateScore(state: SwitchbackState): number {
  return state.status === "won" ? Math.max(1, MAX_SCORE - state.hints) : 0;
}

export function isStateForPuzzle(
  state: SwitchbackState,
  puzzle: SwitchbackPuzzle,
  puzzleId: string,
): boolean {
  const isValidPath =
    state.path[0] === puzzle.marks[0] &&
    state.path.every(
      (cell, step) => step === 0 || canExtend(puzzle, state.path.slice(0, step), cell),
    );
  const complete = isValidPath && isComplete(puzzle, state.path);
  return (
    state.puzzleId === puzzleId &&
    isValidPath &&
    (state.status === "won" ? complete : !complete || state.status === "lost")
  );
}
