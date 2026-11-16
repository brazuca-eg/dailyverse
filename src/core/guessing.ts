import { compareGuessToAnswer, type GuessFeedback } from "./distance";
import type { Country } from "./types";

export const MAX_GUESSES = 5;

export type GameStatus = "playing" | "won" | "lost";

export interface GuessRecord {
  countryCode: string;
  feedback: GuessFeedback;
}

export interface GuessingState {
  puzzleId: string;
  guesses: GuessRecord[];
  status: GameStatus;
}

export function createGuessingState(puzzleId: string): GuessingState {
  return { puzzleId, guesses: [], status: "playing" };
}

export function canSubmitGuess(state: GuessingState, countryCode: string): boolean {
  return (
    state.status === "playing" && !state.guesses.some((guess) => guess.countryCode === countryCode)
  );
}

export function applyGuess(state: GuessingState, guess: Country, answer: Country): GuessingState {
  if (!canSubmitGuess(state, guess.code)) {
    throw new Error(`Guess ${guess.code} cannot be submitted in the current state`);
  }
  const feedback = compareGuessToAnswer(guess, answer);
  const guesses = [...state.guesses, { countryCode: guess.code, feedback }];
  return { ...state, guesses, status: resolveStatus(feedback, guesses.length) };
}

function resolveStatus(latestFeedback: GuessFeedback, guessCount: number): GameStatus {
  if (latestFeedback.isCorrect) {
    return "won";
  }
  return guessCount >= MAX_GUESSES ? "lost" : "playing";
}

export function calculateScore(state: GuessingState): number {
  if (state.status !== "won") {
    return 0;
  }
  return MAX_GUESSES + 1 - state.guesses.length;
}
