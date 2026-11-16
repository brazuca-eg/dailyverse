import { createGuessingState, type GuessingState } from "../../core/guessing";
import type { MysteryPlacePuzzle } from "./types";

export function createInitialState(puzzle: MysteryPlacePuzzle): GuessingState {
  return createGuessingState(puzzle.id);
}

export function countVisibleClues(state: GuessingState, totalClues: number): number {
  if (state.status !== "playing") {
    return totalClues;
  }
  return Math.min(state.guesses.length + 1, totalClues);
}
