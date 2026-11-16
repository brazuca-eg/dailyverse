import { createGuessingState, MAX_GUESSES, type GuessingState } from "../../core/guessing";

export const REVEAL_STAGES = ["crop-small", "crop-large", "blurred", "greyscale", "full"] as const;

export type RevealStage = (typeof REVEAL_STAGES)[number];

export function buildRoundId(code: string, dayIndex: number): string {
  return `${dayIndex}:${code}`;
}

export function createInitialState(code: string, dayIndex: number): GuessingState {
  return createGuessingState(buildRoundId(code, dayIndex));
}

export function resolveRevealStage(state: GuessingState): RevealStage {
  if (state.status !== "playing") {
    return "full";
  }
  return REVEAL_STAGES[Math.min(state.guesses.length, MAX_GUESSES - 1)];
}
