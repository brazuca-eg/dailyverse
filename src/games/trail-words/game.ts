import { scoreWord } from "./analysis";
import { t } from "./messages";
import { hasReachedWinRank } from "./ranks";
import { MIN_WORD_LENGTH } from "./words";
import type { TrailPuzzle } from "./puzzle";

export const MAX_INPUT_LENGTH = 20;

export type TrailStatus = "playing" | "won" | "lost";

export interface TrailState {
  puzzleId: string;
  found: string[];
  ended: boolean;
}

export type RejectionReason =
  "too-short" | "bad-letters" | "missing-centre" | "already-found" | "not-in-list";

export type GuessResult =
  | { accepted: true; word: string; points: number; isPangram: boolean }
  | { accepted: false; reason: RejectionReason };

export interface GuessOutcome {
  state: TrailState;
  result: GuessResult;
}

export function createInitialState(puzzleId: string): TrailState {
  return { puzzleId, found: [], ended: false };
}

export function calculateScore(puzzle: TrailPuzzle, found: readonly string[]): number {
  return found.reduce((total, word) => total + scoreWord(word, puzzle.letterMask), 0);
}

export function readStatus(puzzle: TrailPuzzle, state: TrailState): TrailStatus {
  if (hasReachedWinRank(calculateScore(puzzle, state.found), puzzle.maxScore)) {
    return "won";
  }
  return state.ended ? "lost" : "playing";
}

export function typeLetter(input: string, key: string): string {
  const letter = key.toLowerCase();
  if (!/^[a-z]$/.test(letter) || input.length >= MAX_INPUT_LENGTH) {
    return input;
  }
  return input + letter;
}

export function deleteLastLetter(input: string): string {
  return input.slice(0, -1);
}

export function evaluateGuess(
  puzzle: TrailPuzzle,
  found: readonly string[],
  input: string,
): GuessResult {
  const word = input.toLowerCase();
  if (word.length < MIN_WORD_LENGTH) {
    return { accepted: false, reason: "too-short" };
  }
  if (![...word].every((letter) => puzzle.code.includes(letter))) {
    return { accepted: false, reason: "bad-letters" };
  }
  if (!word.includes(puzzle.centre)) {
    return { accepted: false, reason: "missing-centre" };
  }
  if (found.includes(word)) {
    return { accepted: false, reason: "already-found" };
  }
  if (!puzzle.words.includes(word)) {
    return { accepted: false, reason: "not-in-list" };
  }
  return {
    accepted: true,
    word,
    points: scoreWord(word, puzzle.letterMask),
    isPangram: puzzle.pangrams.includes(word),
  };
}

export function submitGuess(puzzle: TrailPuzzle, state: TrailState, input: string): GuessOutcome {
  if (state.ended) {
    throw new Error("The game has ended, so no more words can be submitted");
  }
  const result = evaluateGuess(puzzle, state.found, input);
  if (!result.accepted) {
    return { state, result };
  }
  return { state: { ...state, found: [...state.found, result.word] }, result };
}

export function endGame(state: TrailState): TrailState {
  return { ...state, ended: true };
}

export function listMissedWords(puzzle: TrailPuzzle, found: readonly string[]): string[] {
  return puzzle.words.filter((word) => !found.includes(word));
}

export function describeRejection(reason: RejectionReason): string {
  switch (reason) {
    case "too-short":
      return t("words.notice.tooShort");
    case "bad-letters":
      return t("words.notice.badLetters");
    case "missing-centre":
      return t("words.notice.missingCentre");
    case "already-found":
      return t("words.notice.alreadyFound");
    case "not-in-list":
      return t("words.notice.notInList");
  }
}

export function describeAcceptance(result: { points: number; isPangram: boolean }): string {
  return result.isPangram
    ? t("words.notice.pangram", { points: result.points })
    : t("words.notice.accepted", { points: result.points });
}
