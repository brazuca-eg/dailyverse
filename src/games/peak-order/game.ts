import type { GameStatus } from "../../core/guessing";
import { moveItem } from "./arrange";
import { checkOrder } from "./feedback";
import type { PeakPuzzle } from "./puzzle";

export const MAX_CHECKS = 5;
export const MAX_SCORE = 5;

export interface PeakState {
  puzzleId: string;
  order: number[];
  history: number[][];
}

export function createInitialState(puzzle: PeakPuzzle): PeakState {
  return { puzzleId: puzzle.id, order: [...puzzle.start], history: [] };
}

function findLastChecked(state: PeakState): number[] | null {
  return state.history[state.history.length - 1] ?? null;
}

export function readStatus(state: PeakState): GameStatus {
  const last = findLastChecked(state);
  if (last !== null && checkOrder(last).isSolved) {
    return "won";
  }
  return state.history.length >= MAX_CHECKS ? "lost" : "playing";
}

export function readChecksLeft(state: PeakState): number {
  return MAX_CHECKS - state.history.length;
}

export function canCheck(state: PeakState): boolean {
  const last = findLastChecked(state);
  const isChanged = last === null || last.some((item, position) => item !== state.order[position]);
  return readStatus(state) === "playing" && isChanged;
}

export function applyMove(state: PeakState, from: number, to: number): PeakState {
  if (readStatus(state) !== "playing") {
    return state;
  }
  return { ...state, order: moveItem(state.order, from, to) };
}

export function applyCheck(state: PeakState): PeakState {
  if (!canCheck(state)) {
    return state;
  }
  return { ...state, history: [...state.history, [...state.order]] };
}

export function readConfirmed(state: PeakState): boolean[] {
  const last = findLastChecked(state);
  if (last === null) {
    return state.order.map(() => false);
  }
  const { correct } = checkOrder(last);
  return state.order.map((item, position) => correct[position] && item === last[position]);
}

export function readCheckRows(state: PeakState): boolean[][] {
  return state.history.map((order) => checkOrder(order).correct);
}

export function calculateScore(state: PeakState): number {
  return readStatus(state) === "won" ? MAX_CHECKS + 1 - state.history.length : 0;
}
