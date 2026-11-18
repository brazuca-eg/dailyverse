import type { GameStatus } from "../../core/guessing";
import { toBit } from "./layout";
import { readLayout } from "./readLayout";
import { readPeers } from "./solver";
import type { SudokuPuzzle, SudokuRound } from "./types";

export const MAX_SCORE = 5;

export interface Move {
  index: number;
  entry: number;
  notes: number;
}

export interface SudokuState {
  puzzleId: string;
  entries: number[];
  notes: number[];
  flagged: number[];
  moves: Move[];
  checks: number;
  hints: number;
  elapsedSeconds: number;
  status: GameStatus;
}

export interface CheckResult {
  state: SudokuState;
  wrong: number;
}

export function buildPuzzleId(round: SudokuRound): string {
  return `${round.tier}:${round.seed}`;
}

export function createInitialState(puzzleId: string, size: number): SudokuState {
  const cells = size * size;
  return {
    puzzleId,
    entries: Array.from({ length: cells }, () => 0),
    notes: Array.from({ length: cells }, () => 0),
    flagged: [],
    moves: [],
    checks: 0,
    hints: 0,
    elapsedSeconds: 0,
    status: "playing",
  };
}

export function readValues(puzzle: SudokuPuzzle, entries: readonly number[]): number[] {
  return puzzle.givens.map((given, index) => (given !== 0 ? given : entries[index]));
}

export function isSolved(puzzle: SudokuPuzzle, entries: readonly number[]): boolean {
  return readValues(puzzle, entries).every((value, index) => value === puzzle.solution[index]);
}

function isEditable(state: SudokuState, puzzle: SudokuPuzzle, index: number): boolean {
  return state.status === "playing" && puzzle.givens[index] === 0;
}

function resolveStatus(puzzle: SudokuPuzzle, entries: readonly number[]): GameStatus {
  return isSolved(puzzle, entries) ? "won" : "playing";
}

function replaceCell(
  state: SudokuState,
  puzzle: SudokuPuzzle,
  index: number,
  entry: number,
  notes: number,
): SudokuState {
  if (state.entries[index] === entry && state.notes[index] === notes) {
    return state;
  }
  const entries = state.entries.map((value, position) => (position === index ? entry : value));
  return {
    ...state,
    entries,
    notes: state.notes.map((value, position) => (position === index ? notes : value)),
    flagged: state.flagged.filter((flag) => flag !== index),
    moves: [...state.moves, { index, entry: state.entries[index], notes: state.notes[index] }],
    status: resolveStatus(puzzle, entries),
  };
}

export function enterDigit(
  state: SudokuState,
  puzzle: SudokuPuzzle,
  index: number,
  digit: number,
): SudokuState {
  if (!isEditable(state, puzzle, index) || digit < 1 || digit > puzzle.size) {
    return state;
  }
  const entry = state.entries[index] === digit ? 0 : digit;
  return replaceCell(state, puzzle, index, entry, 0);
}

export function toggleNote(
  state: SudokuState,
  puzzle: SudokuPuzzle,
  index: number,
  digit: number,
): SudokuState {
  if (
    !isEditable(state, puzzle, index) ||
    state.entries[index] !== 0 ||
    digit < 1 ||
    digit > puzzle.size
  ) {
    return state;
  }
  return replaceCell(state, puzzle, index, 0, state.notes[index] ^ toBit(digit));
}

export function eraseCell(state: SudokuState, puzzle: SudokuPuzzle, index: number): SudokuState {
  if (!isEditable(state, puzzle, index)) {
    return state;
  }
  return replaceCell(state, puzzle, index, 0, 0);
}

export function undoMove(state: SudokuState, puzzle: SudokuPuzzle): SudokuState {
  const last = state.moves[state.moves.length - 1];
  if (state.status !== "playing" || !last) {
    return state;
  }
  const entries = state.entries.map((value, position) =>
    position === last.index ? last.entry : value,
  );
  return {
    ...state,
    entries,
    notes: state.notes.map((value, position) => (position === last.index ? last.notes : value)),
    flagged: state.flagged.filter((flag) => flag !== last.index),
    moves: state.moves.slice(0, -1),
    status: resolveStatus(puzzle, entries),
  };
}

function listWrongCells(puzzle: SudokuPuzzle, entries: readonly number[]): number[] {
  return entries
    .map((entry, index) => ({ entry, index }))
    .filter(({ entry, index }) => entry !== 0 && entry !== puzzle.solution[index])
    .map(({ index }) => index);
}

export function checkBoard(state: SudokuState, puzzle: SudokuPuzzle): CheckResult {
  if (state.status !== "playing") {
    return { state, wrong: 0 };
  }
  const wrongCells = listWrongCells(puzzle, state.entries);
  if (wrongCells.length === 0) {
    return { state: { ...state, flagged: [] }, wrong: 0 };
  }
  return {
    state: { ...state, flagged: wrongCells, checks: state.checks + 1 },
    wrong: wrongCells.length,
  };
}

export function findHintCell(
  state: SudokuState,
  puzzle: SudokuPuzzle,
  preferred: number | null,
): number | null {
  const needsHelp = (index: number) =>
    puzzle.givens[index] === 0 && state.entries[index] !== puzzle.solution[index];
  if (preferred !== null && needsHelp(preferred)) {
    return preferred;
  }
  const first = puzzle.givens.findIndex((_, index) => needsHelp(index));
  return first === -1 ? null : first;
}

export function giveHint(
  state: SudokuState,
  puzzle: SudokuPuzzle,
  preferred: number | null,
): SudokuState {
  const index = state.status === "playing" ? findHintCell(state, puzzle, preferred) : null;
  if (index === null) {
    return state;
  }
  const filled = replaceCell(state, puzzle, index, puzzle.solution[index], 0);
  return { ...filled, hints: filled.hints + 1 };
}

export function giveUp(state: SudokuState): SudokuState {
  return state.status === "playing" ? { ...state, status: "lost" } : state;
}

export function addElapsed(state: SudokuState, seconds: number): SudokuState {
  return state.status === "playing"
    ? { ...state, elapsedSeconds: state.elapsedSeconds + seconds }
    : state;
}

export function findConflicts(puzzle: SudokuPuzzle, values: readonly number[]): number[] {
  const peers = readPeers(readLayout(puzzle.size));
  return values
    .map((value, index) => ({ value, index }))
    .filter(
      ({ value, index }) => value !== 0 && peers[index].some((peer) => values[peer] === value),
    )
    .map(({ index }) => index);
}

export function countFilled(puzzle: SudokuPuzzle, entries: readonly number[]): number {
  return readValues(puzzle, entries).filter((value) => value !== 0).length;
}

export function countDigit(
  puzzle: SudokuPuzzle,
  entries: readonly number[],
  digit: number,
): number {
  return readValues(puzzle, entries).filter((value) => value === digit).length;
}

export function calculateScore(state: SudokuState): number {
  return state.status === "won" ? Math.max(1, MAX_SCORE - state.checks - state.hints) : 0;
}

export function isStateForPuzzle(
  state: SudokuState,
  puzzle: SudokuPuzzle,
  puzzleId: string,
): boolean {
  const cells = puzzle.size * puzzle.size;
  const maxMask = (1 << puzzle.size) - 1;
  const solved = isSolved(puzzle, state.entries);
  return (
    state.puzzleId === puzzleId &&
    state.entries.length === cells &&
    state.notes.length === cells &&
    state.entries.every(
      (entry, index) =>
        entry >= 0 && entry <= puzzle.size && (puzzle.givens[index] === 0 || entry === 0),
    ) &&
    state.notes.every(
      (mask, index) => mask >= 0 && mask <= maxMask && (puzzle.givens[index] === 0 || mask === 0),
    ) &&
    state.flagged.every((index) => index >= 0 && index < cells) &&
    state.moves.every((move) => move.index >= 0 && move.index < cells) &&
    (state.status === "won" ? solved : !solved || state.status === "lost")
  );
}
