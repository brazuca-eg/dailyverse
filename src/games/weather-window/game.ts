import type { GameStatus } from "../../core/guessing";
import { analysePuzzle, scorePlan } from "./solver";
import { TIER_SETTINGS } from "./tiers";
import { UNPLACED, type WeatherPuzzle, type WeatherRound } from "./types";

export const MAX_SCORE = 5;
export const WIN_SHARE = 0.55;
export const PHASES = ["intro", "memorise", "plan", "done"] as const;

export type Phase = (typeof PHASES)[number];

export interface WeatherState {
  puzzleId: string;
  phase: Phase;
  plan: number[];
  peeksUsed: number;
  status: GameStatus;
}

const STAR_STEPS = [WIN_SHARE, 0.75, 0.9, 1];

export function buildPuzzleId(round: WeatherRound): string {
  return `${round.tier}:${round.poolIndex}`;
}

export function createInitialState(puzzleId: string, puzzle: WeatherPuzzle): WeatherState {
  return {
    puzzleId,
    phase: "intro",
    plan: puzzle.trips.map(() => UNPLACED),
    peeksUsed: 0,
    status: "playing",
  };
}

export function startPreview(state: WeatherState): WeatherState {
  return state.phase === "intro" ? { ...state, phase: "memorise" } : state;
}

export function finishPreview(state: WeatherState): WeatherState {
  return state.phase === "memorise" ? { ...state, phase: "plan" } : state;
}

export function placeTrip(state: WeatherState, trip: number, day: number): WeatherState {
  if (state.phase !== "plan") {
    return state;
  }
  return {
    ...state,
    plan: state.plan.map((placed, index) => {
      if (index === trip) {
        return day;
      }
      return placed === day ? UNPLACED : placed;
    }),
  };
}

export function removeTrip(state: WeatherState, trip: number): WeatherState {
  if (state.phase !== "plan") {
    return state;
  }
  return {
    ...state,
    plan: state.plan.map((placed, index) => (index === trip ? UNPLACED : placed)),
  };
}

export function findTripOnDay(state: WeatherState, day: number): number {
  return state.plan.indexOf(day);
}

export function isPlanComplete(state: WeatherState): boolean {
  return state.plan.every((day) => day !== UNPLACED);
}

export function countPeeksLeft(state: WeatherState, allowed: number): number {
  return Math.max(0, allowed - state.peeksUsed);
}

export function spendPeek(state: WeatherState, allowed: number): WeatherState {
  if (state.phase !== "plan" || countPeeksLeft(state, allowed) === 0) {
    return state;
  }
  return { ...state, peeksUsed: state.peeksUsed + 1 };
}

export function readPlanShare(plan: readonly number[], puzzle: WeatherPuzzle): number {
  return scorePlan(puzzle, plan) / analysePuzzle(puzzle).best;
}

export function rateShare(share: number): number {
  return 1 + STAR_STEPS.filter((step) => share >= step).length;
}

export function submitPlan(state: WeatherState, puzzle: WeatherPuzzle): WeatherState {
  if (state.phase !== "plan" || !isPlanComplete(state)) {
    return state;
  }
  const isWin = readPlanShare(state.plan, puzzle) >= WIN_SHARE;
  return { ...state, phase: "done", status: isWin ? "won" : "lost" };
}

export function calculateScore(state: WeatherState, puzzle: WeatherPuzzle): number {
  if (state.status !== "won") {
    return 0;
  }
  return Math.max(1, rateShare(readPlanShare(state.plan, puzzle)) - state.peeksUsed);
}

function hasValidPlan(state: WeatherState, puzzle: WeatherPuzzle): boolean {
  const placed = state.plan.filter((day) => day !== UNPLACED);
  return (
    state.plan.length === puzzle.trips.length &&
    placed.every((day) => Number.isInteger(day) && day >= 0 && day < puzzle.weather.length) &&
    new Set(placed).size === placed.length
  );
}

export function isStateForRound(state: WeatherState, round: WeatherRound): boolean {
  const { puzzle } = round;
  const isDone = state.phase === "done";
  const isBeforePlanning = state.phase === "intro" || state.phase === "memorise";
  const expectedStatus = readPlanShare(state.plan, puzzle) >= WIN_SHARE ? "won" : "lost";
  return (
    state.puzzleId === buildPuzzleId(round) &&
    hasValidPlan(state, puzzle) &&
    state.peeksUsed <= TIER_SETTINGS[round.tier].peeks &&
    (isDone
      ? isPlanComplete(state) && state.status === expectedStatus
      : state.status === "playing") &&
    (!isBeforePlanning || (state.peeksUsed === 0 && state.plan.every((day) => day === UNPLACED)))
  );
}
