import type { GameStatus } from "../../core/guessing";
import {
  isValidSolution,
  listAllNeighbours,
  listOrthogonalNeighbours,
  toCell,
  toIndex,
} from "./rules";
import type { Cell, TentsPuzzle } from "./types";

export const EMPTY = 0;
export const TENT = 1;
export const GRASS = 2;
export const MAX_SCORE = 5;

export interface Move {
  index: number;
  before: number;
  after: number;
}

export interface TentsState {
  puzzleId: string;
  marks: number[];
  moves: Move[];
  checks: number;
  hints: number;
  elapsedSeconds: number;
  status: GameStatus;
}

export type LineStatus = "under" | "met" | "over";

export interface Analysis {
  rows: LineStatus[];
  cols: LineStatus[];
  clashing: number[];
}

export interface CheckResult {
  state: TentsState;
  wrong: number;
}

export function buildPuzzleId(seed: number, tier: string): string {
  return `${seed}:${tier}`;
}

export function createInitialState(puzzleId: string, size: number): TentsState {
  return {
    puzzleId,
    marks: Array.from({ length: size * size }, () => EMPTY),
    moves: [],
    checks: 0,
    hints: 0,
    elapsedSeconds: 0,
    status: "playing",
  };
}

export function readTents(size: number, marks: readonly number[]): Cell[] {
  return marks
    .map((mark, index) => (mark === TENT ? toCell(size, index) : null))
    .filter((cell): cell is Cell => cell !== null);
}

function isTree(puzzle: TentsPuzzle, index: number): boolean {
  return puzzle.trees.some((tree) => toIndex(puzzle.size, tree) === index);
}

function resolveStatus(puzzle: TentsPuzzle, marks: readonly number[]): GameStatus {
  return isValidSolution(puzzle, readTents(puzzle.size, marks)) ? "won" : "playing";
}

function mark(state: TentsState, puzzle: TentsPuzzle, index: number, after: number): TentsState {
  const before = state.marks[index];
  if (state.status !== "playing" || isTree(puzzle, index) || before === after) {
    return state;
  }
  const marks = state.marks.map((value, position) => (position === index ? after : value));
  return {
    ...state,
    marks,
    moves: [...state.moves, { index, before, after }],
    status: resolveStatus(puzzle, marks),
  };
}

export function cycleCell(state: TentsState, puzzle: TentsPuzzle, index: number): TentsState {
  const next = (state.marks[index] + 1) % 3;
  return mark(state, puzzle, index, next);
}

export function paintGrass(
  state: TentsState,
  puzzle: TentsPuzzle,
  indexes: readonly number[],
): TentsState {
  return indexes.reduce(
    (current, index) =>
      current.marks[index] === EMPTY ? mark(current, puzzle, index, GRASS) : current,
    state,
  );
}

export function undo(state: TentsState, puzzle: TentsPuzzle): TentsState {
  const last = state.moves[state.moves.length - 1];
  if (state.status !== "playing" || !last) {
    return state;
  }
  const marks = state.marks.map((value, position) =>
    position === last.index ? last.before : value,
  );
  return { ...state, marks, moves: state.moves.slice(0, -1), status: resolveStatus(puzzle, marks) };
}

export function clearBoard(state: TentsState): TentsState {
  if (state.status !== "playing") {
    return state;
  }
  return { ...state, marks: state.marks.map(() => EMPTY), moves: [] };
}

function listSolutionIndexes(puzzle: TentsPuzzle): number[] {
  return puzzle.solution.map((tent) => toIndex(puzzle.size, tent));
}

export function countWrongMarks(puzzle: TentsPuzzle, marks: readonly number[]): number {
  const solution = new Set(listSolutionIndexes(puzzle));
  return marks.filter(
    (value, index) =>
      (value === TENT && !solution.has(index)) || (value === GRASS && solution.has(index)),
  ).length;
}

export function check(state: TentsState, puzzle: TentsPuzzle): CheckResult {
  if (state.status !== "playing") {
    return { state, wrong: 0 };
  }
  const wrong = countWrongMarks(puzzle, state.marks);
  return { state: wrong > 0 ? { ...state, checks: state.checks + 1 } : state, wrong };
}

export function giveHint(state: TentsState, puzzle: TentsPuzzle): TentsState {
  if (state.status !== "playing") {
    return state;
  }
  const missing = listSolutionIndexes(puzzle).find((index) => state.marks[index] !== TENT);
  if (missing === undefined) {
    return state;
  }
  const placed = mark(state, puzzle, missing, TENT);
  return { ...placed, hints: placed.hints + 1 };
}

export function giveUp(state: TentsState): TentsState {
  return state.status === "playing" ? { ...state, status: "lost" } : state;
}

export function addElapsed(state: TentsState, seconds: number): TentsState {
  return state.status === "playing"
    ? { ...state, elapsedSeconds: state.elapsedSeconds + seconds }
    : state;
}

function compareLine(count: number, target: number): LineStatus {
  if (count < target) {
    return "under";
  }
  return count === target ? "met" : "over";
}

export function analyse(puzzle: TentsPuzzle, marks: readonly number[]): Analysis {
  const { size } = puzzle;
  const tents = readTents(size, marks);
  const tentIndexes = new Set(tents.map((tent) => toIndex(size, tent)));
  const treeIndexes = new Set(puzzle.trees.map((tree) => toIndex(size, tree)));
  const clashing = tents
    .filter((tent) => {
      const touches = listAllNeighbours(size, tent).some((near) =>
        tentIndexes.has(toIndex(size, near)),
      );
      const lonely = !listOrthogonalNeighbours(size, tent).some((near) =>
        treeIndexes.has(toIndex(size, near)),
      );
      return touches || lonely;
    })
    .map((tent) => toIndex(size, tent));
  return {
    rows: puzzle.rowCounts.map((target, row) =>
      compareLine(tents.filter((tent) => tent.row === row).length, target),
    ),
    cols: puzzle.colCounts.map((target, col) =>
      compareLine(tents.filter((tent) => tent.col === col).length, target),
    ),
    clashing,
  };
}

export function calculateScore(state: TentsState): number {
  return state.status === "won" ? Math.max(1, MAX_SCORE - state.checks - state.hints) : 0;
}

export function isStateForPuzzle(
  state: TentsState,
  puzzle: TentsPuzzle,
  puzzleId: string,
): boolean {
  const cellCount = puzzle.size * puzzle.size;
  const solved = isValidSolution(puzzle, readTents(puzzle.size, state.marks));
  return (
    state.puzzleId === puzzleId &&
    state.marks.length === cellCount &&
    state.marks.every((value, index) => !isTree(puzzle, index) || value === EMPTY) &&
    state.moves.every((move) => move.index >= 0 && move.index < cellCount) &&
    (state.status === "won" ? solved : !solved || state.status === "lost")
  );
}
