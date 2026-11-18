import type { GameStatus } from "../../core/guessing";
import { countAdjacentBears, floodReveal, listStartCells } from "./counts";
import { readNeighbours } from "./grid";
import { findDeducedSafeCells } from "./logic";
import type { BearPuzzle, BearRound } from "./types";

export const HIDDEN = 0;
export const REVEALED = 1;
export const FLAGGED = 2;
export const TRIGGERED = 3;
export const MAX_LIVES = 3;
export const MAX_SCORE = 5;

export interface BearState {
  puzzleId: string;
  cells: number[];
  hints: number;
  elapsedSeconds: number;
  status: GameStatus;
}

export function buildPuzzleId(round: BearRound): string {
  return `${round.tier}:${round.poolIndex}`;
}

export function createInitialState(puzzleId: string, puzzle: BearPuzzle): BearState {
  const opened = new Set(listStartCells(puzzle));
  return {
    puzzleId,
    cells: Array.from({ length: puzzle.size * puzzle.size }, (_, index) =>
      opened.has(index) ? REVEALED : HIDDEN,
    ),
    hints: 0,
    elapsedSeconds: 0,
    status: "playing",
  };
}

function listCellsWith(state: BearState, code: number): number[] {
  return state.cells
    .map((cell, index) => (cell === code ? index : -1))
    .filter((index) => index >= 0);
}

export function countEncounters(state: BearState): number {
  return listCellsWith(state, TRIGGERED).length;
}

export function readLivesLeft(state: BearState): number {
  return Math.max(0, MAX_LIVES - countEncounters(state));
}

export function countBearsLeft(state: BearState, puzzle: BearPuzzle): number {
  return puzzle.bears.length - listCellsWith(state, FLAGGED).length - countEncounters(state);
}

function isCleared(state: BearState, puzzle: BearPuzzle): boolean {
  const bears = new Set(puzzle.bears);
  return state.cells.every((cell, index) => bears.has(index) || cell === REVEALED);
}

function resolveStatus(state: BearState, puzzle: BearPuzzle): BearState {
  if (countEncounters(state) >= MAX_LIVES) {
    return { ...state, status: "lost" };
  }
  return isCleared(state, puzzle) ? { ...state, status: "won" } : state;
}

function setCells(state: BearState, changes: ReadonlyMap<number, number>): BearState {
  return { ...state, cells: state.cells.map((cell, index) => changes.get(index) ?? cell) };
}

export function revealCell(state: BearState, puzzle: BearPuzzle, index: number): BearState {
  if (state.status !== "playing" || state.cells[index] !== HIDDEN) {
    return state;
  }
  if (puzzle.bears.includes(index)) {
    return resolveStatus(setCells(state, new Map([[index, TRIGGERED]])), puzzle);
  }
  const opened = floodReveal(
    puzzle,
    countAdjacentBears(puzzle),
    index,
    (cell) => state.cells[cell] !== HIDDEN,
  );
  return resolveStatus(setCells(state, new Map(opened.map((cell) => [cell, REVEALED]))), puzzle);
}

export function toggleFlag(state: BearState, index: number): BearState {
  if (state.status !== "playing") {
    return state;
  }
  if (state.cells[index] === HIDDEN) {
    return setCells(state, new Map([[index, FLAGGED]]));
  }
  return state.cells[index] === FLAGGED ? setCells(state, new Map([[index, HIDDEN]])) : state;
}

export function chordCell(state: BearState, puzzle: BearPuzzle, index: number): BearState {
  const count = countAdjacentBears(puzzle)[index];
  if (state.status !== "playing" || state.cells[index] !== REVEALED || count === 0) {
    return state;
  }
  const neighbours = readNeighbours(puzzle.size)[index];
  const marked = neighbours.filter(
    (next) => state.cells[next] === FLAGGED || state.cells[next] === TRIGGERED,
  );
  if (marked.length !== count) {
    return state;
  }
  return neighbours.reduce((current, next) => revealCell(current, puzzle, next), state);
}

export function findHintCell(state: BearState, puzzle: BearPuzzle): number | null {
  const safe = findDeducedSafeCells(
    puzzle,
    listCellsWith(state, REVEALED),
    listCellsWith(state, TRIGGERED),
  );
  return (
    safe.find((index) => state.cells[index] === HIDDEN || state.cells[index] === FLAGGED) ?? null
  );
}

export function giveHint(state: BearState, puzzle: BearPuzzle): BearState {
  const index = state.status === "playing" ? findHintCell(state, puzzle) : null;
  if (index === null) {
    return state;
  }
  const unflagged = setCells(state, new Map([[index, HIDDEN]]));
  const revealed = revealCell(unflagged, puzzle, index);
  return { ...revealed, hints: revealed.hints + 1 };
}

export function giveUp(state: BearState): BearState {
  return state.status === "playing" ? { ...state, status: "lost" } : state;
}

export function addElapsed(state: BearState, seconds: number): BearState {
  return state.status === "playing"
    ? { ...state, elapsedSeconds: state.elapsedSeconds + seconds }
    : state;
}

export function calculateScore(state: BearState): number {
  return state.status === "won" ? Math.max(1, MAX_SCORE - countEncounters(state) - state.hints) : 0;
}

export function isStateForPuzzle(state: BearState, puzzle: BearPuzzle, puzzleId: string): boolean {
  const cells = puzzle.size * puzzle.size;
  const bears = new Set(puzzle.bears);
  const hasValidCells =
    state.cells.length === cells &&
    state.cells.every(
      (cell, index) =>
        cell >= HIDDEN &&
        cell <= TRIGGERED &&
        (cell !== TRIGGERED || bears.has(index)) &&
        (cell !== REVEALED || !bears.has(index)),
    );
  const hasClearing = listStartCells(puzzle).every((index) => state.cells[index] === REVEALED);
  const cleared = hasValidCells && isCleared(state, puzzle);
  const isOut = hasValidCells && countEncounters(state) >= MAX_LIVES;
  return (
    state.puzzleId === puzzleId &&
    hasValidCells &&
    hasClearing &&
    (state.status === "won" ? cleared && !isOut : state.status === "lost" || (!cleared && !isOut))
  );
}
