import { describe, expect, it } from "vitest";
import { applyGameResult, createEmptyStats } from "../../core/streak";
import { createMemoryStore, requireCountry } from "../../core/testing";
import { puzzles } from "./data";
import { applyGuess, createInitialState } from "./game";
import {
  GAME_STORAGE_KEY,
  HELP_SEEN_STORAGE_KEY,
  hasSeenHelp,
  loadGameStats,
  markHelpSeen,
  findSavedGameState,
  saveGameState,
  saveGameStats,
} from "./persistence";

const puzzle = puzzles[0];
const otherPuzzle = puzzles[1];
const answer = requireCountry(puzzle.country);
const australia = requireCountry("AU");
const afterOneGuess = applyGuess(createInitialState(puzzle), australia, answer);

describe("saved game state", () => {
  it("restores the saved state for the same day and puzzle", () => {
    const store = createMemoryStore();
    expect(saveGameState(7, afterOneGuess, store)).toBe(true);
    expect(findSavedGameState(puzzle, 7, store)).toEqual(afterOneGuess);
  });

  it("ignores a save from another day", () => {
    const store = createMemoryStore();
    saveGameState(7, afterOneGuess, store);
    expect(findSavedGameState(puzzle, 8, store)).toBeNull();
  });

  it("ignores a save for another puzzle", () => {
    const store = createMemoryStore();
    saveGameState(7, afterOneGuess, store);
    expect(findSavedGameState(otherPuzzle, 7, store)).toBeNull();
  });

  it("returns null when nothing is saved", () => {
    expect(findSavedGameState(puzzle, 7, createMemoryStore())).toBeNull();
  });

  it("returns null for corrupted data", () => {
    const store = createMemoryStore({ [GAME_STORAGE_KEY]: "{broken" });
    expect(findSavedGameState(puzzle, 7, store)).toBeNull();
  });

  it("returns null for data with the wrong shape", () => {
    const wrongStatus = { dayIndex: 7, state: { ...afterOneGuess, status: "cheating" } };
    const store = createMemoryStore({ [GAME_STORAGE_KEY]: JSON.stringify(wrongStatus) });
    expect(findSavedGameState(puzzle, 7, store)).toBeNull();
  });

  it("returns null when a guess has an unknown direction", () => {
    const badGuess = {
      countryCode: "AU",
      feedback: { distanceKm: 10, direction: "UP", isCorrect: false },
    };
    const tampered = { dayIndex: 7, state: { ...afterOneGuess, guesses: [badGuess] } };
    const store = createMemoryStore({ [GAME_STORAGE_KEY]: JSON.stringify(tampered) });
    expect(findSavedGameState(puzzle, 7, store)).toBeNull();
  });

  it("restores a won game whose correct guess has no distance or direction", () => {
    const won = applyGuess(createInitialState(puzzle), answer, answer);
    const store = createMemoryStore();
    saveGameState(7, won, store);
    expect(findSavedGameState(puzzle, 7, store)).toEqual(won);
    expect(JSON.stringify(won.guesses[0].feedback)).toBe('{"isCorrect":true}');
  });

  it("still restores a game saved when correct guesses carried a placeholder distance", () => {
    const legacyCorrectGuess = {
      countryCode: puzzle.country,
      feedback: { distanceKm: 0, direction: "N", isCorrect: true },
    };
    const legacy = {
      dayIndex: 7,
      state: { puzzleId: puzzle.id, guesses: [legacyCorrectGuess], status: "won" },
    };
    const store = createMemoryStore({ [GAME_STORAGE_KEY]: JSON.stringify(legacy) });
    expect(findSavedGameState(puzzle, 7, store)?.status).toBe("won");
  });

  it("returns null when a wrong guess is missing its distance or direction", () => {
    const withoutDistance = { countryCode: "AU", feedback: { isCorrect: false, direction: "N" } };
    const withoutDirection = { countryCode: "AU", feedback: { isCorrect: false, distanceKm: 10 } };
    [withoutDistance, withoutDirection].forEach((guess) => {
      const tampered = { dayIndex: 7, state: { ...afterOneGuess, guesses: [guess] } };
      const store = createMemoryStore({ [GAME_STORAGE_KEY]: JSON.stringify(tampered) });
      expect(findSavedGameState(puzzle, 7, store)).toBeNull();
    });
  });

  it("returns null when isCorrect is not a boolean", () => {
    const badGuess = { countryCode: "AU", feedback: { isCorrect: "yes" } };
    const tampered = { dayIndex: 7, state: { ...afterOneGuess, guesses: [badGuess] } };
    const store = createMemoryStore({ [GAME_STORAGE_KEY]: JSON.stringify(tampered) });
    expect(findSavedGameState(puzzle, 7, store)).toBeNull();
  });

  it("returns null when there are more guesses than allowed", () => {
    const guesses = Array.from({ length: 6 }, () => afterOneGuess.guesses[0]);
    const tampered = { dayIndex: 7, state: { ...afterOneGuess, guesses } };
    const store = createMemoryStore({ [GAME_STORAGE_KEY]: JSON.stringify(tampered) });
    expect(findSavedGameState(puzzle, 7, store)).toBeNull();
  });
});

describe("help seen flag", () => {
  it("is false until marked, then true", () => {
    const store = createMemoryStore();
    expect(hasSeenHelp(store)).toBe(false);
    expect(markHelpSeen(store)).toBe(true);
    expect(hasSeenHelp(store)).toBe(true);
  });

  it("ignores unexpected stored values", () => {
    const store = createMemoryStore({ [HELP_SEEN_STORAGE_KEY]: JSON.stringify("yes") });
    expect(hasSeenHelp(store)).toBe(false);
  });

  it("is false without a store", () => {
    expect(hasSeenHelp(null)).toBe(false);
  });
});

describe("saved game stats", () => {
  it("returns empty stats when nothing is saved", () => {
    expect(loadGameStats(createMemoryStore())).toEqual(createEmptyStats());
  });

  it("round-trips stats", () => {
    const store = createMemoryStore();
    const stats = applyGameResult(createEmptyStats(), 7, true);
    expect(saveGameStats(stats, store)).toBe(true);
    expect(loadGameStats(store)).toEqual(stats);
  });

  it("falls back to empty stats for corrupted data", () => {
    const store = createMemoryStore({ "dailyverse:mystery-place:stats": "nope" });
    expect(loadGameStats(store)).toEqual(createEmptyStats());
  });
});
