import { compareGuessToAnswer, type GuessFeedback } from "../../core/distance";
import type { Country } from "../../core/types";
import type { MysteryPlacePuzzle } from "./types";

export const MAX_GUESSES = 5;

export type GameStatus = "playing" | "won" | "lost";

export interface GuessRecord {
  countryCode: string;
  feedback: GuessFeedback;
}

export interface GameState {
  puzzleId: string;
  guesses: GuessRecord[];
  status: GameStatus;
}

export function createInitialState(puzzle: MysteryPlacePuzzle): GameState {
  return { puzzleId: puzzle.id, guesses: [], status: "playing" };
}

export function canSubmitGuess(state: GameState, countryCode: string): boolean {
  return (
    state.status === "playing" && !state.guesses.some((guess) => guess.countryCode === countryCode)
  );
}

export function applyGuess(state: GameState, guess: Country, answer: Country): GameState {
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

export function countVisibleClues(state: GameState, totalClues: number): number {
  if (state.status !== "playing") {
    return totalClues;
  }
  return Math.min(state.guesses.length + 1, totalClues);
}

export function calculateScore(state: GameState): number {
  if (state.status !== "won") {
    return 0;
  }
  return MAX_GUESSES + 1 - state.guesses.length;
}
