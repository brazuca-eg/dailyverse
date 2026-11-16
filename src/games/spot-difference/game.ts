import type { GameStatus } from "../../core/guessing";
import { DIFFERENCE_COUNT } from "./difficulty";
import type { Bounds, Difference, Puzzle } from "./types";

export const MAX_LIVES = 3;
export const TAP_TOLERANCE = 14;

export interface Point {
  x: number;
  y: number;
}

export interface MissMark {
  point: Point;
  key: number;
}

export interface SpotState {
  puzzleId: string;
  found: string[];
  mistakes: number;
  status: GameStatus;
}

export type TapOutcome = "found" | "missed" | "repeat" | "ignored";

export interface TapResult {
  state: SpotState;
  outcome: TapOutcome;
  differenceId: string | null;
}

export function buildPuzzleId(puzzle: Pick<Puzzle, "seed" | "tier">): string {
  return `${puzzle.seed}:${puzzle.tier}`;
}

export function createInitialState(puzzleId: string): SpotState {
  return { puzzleId, found: [], mistakes: 0, status: "playing" };
}

function measureDistanceToBounds(point: Point, bounds: Bounds): number {
  const dx = Math.max(bounds.left - point.x, 0, point.x - bounds.right);
  const dy = Math.max(bounds.top - point.y, 0, point.y - bounds.bottom);
  return Math.hypot(dx, dy);
}

export function findHitDifference(
  differences: readonly Difference[],
  point: Point,
  tolerance = TAP_TOLERANCE,
): Difference | null {
  const hits = differences
    .map((difference) => ({
      difference,
      distance: measureDistanceToBounds(point, difference.region),
    }))
    .filter((hit) => hit.distance <= tolerance)
    .sort((first, second) => first.distance - second.distance);
  return hits.length > 0 ? hits[0].difference : null;
}

function resolveStatus(found: readonly string[], mistakes: number): GameStatus {
  if (found.length >= DIFFERENCE_COUNT) {
    return "won";
  }
  return mistakes >= MAX_LIVES ? "lost" : "playing";
}

export function applyTap(
  state: SpotState,
  puzzle: Puzzle,
  point: Point,
  tolerance = TAP_TOLERANCE,
): TapResult {
  if (state.status !== "playing") {
    return { state, outcome: "ignored", differenceId: null };
  }
  const hit = findHitDifference(puzzle.differences, point, tolerance);
  if (hit === null) {
    const mistakes = state.mistakes + 1;
    return {
      state: { ...state, mistakes, status: resolveStatus(state.found, mistakes) },
      outcome: "missed",
      differenceId: null,
    };
  }
  if (state.found.includes(hit.id)) {
    return { state, outcome: "repeat", differenceId: hit.id };
  }
  const found = [...state.found, hit.id];
  return {
    state: { ...state, found, status: resolveStatus(found, state.mistakes) },
    outcome: "found",
    differenceId: hit.id,
  };
}

export function countLivesLeft(state: SpotState): number {
  return Math.max(0, MAX_LIVES - state.mistakes);
}

export function calculateScore(state: SpotState): number {
  return state.status === "won" ? DIFFERENCE_COUNT - state.mistakes : 0;
}

export function isStateForPuzzle(state: SpotState, puzzle: Puzzle): boolean {
  const knownIds = new Set(puzzle.differences.map((difference) => difference.id));
  return (
    state.puzzleId === buildPuzzleId(puzzle) &&
    state.found.every((id) => knownIds.has(id)) &&
    new Set(state.found).size === state.found.length &&
    state.status === resolveStatus(state.found, state.mistakes)
  );
}
