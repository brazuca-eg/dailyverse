import { describe, expect, it } from "vitest";
import { applyGuess, createGuessingState } from "./guessing";
import { createGameStorage } from "./gameStorage";
import { applyGameResult, createEmptyStats } from "./streak";
import { createMemoryStore, requireCountry } from "./testing";

const storage = createGameStorage("test-game");
const puzzle = { id: "puzzle-a", country: "PT" };
const otherPuzzle = { id: "puzzle-b", country: "ES" };
const answer = requireCountry(puzzle.country);
const australia = requireCountry("AU");
const afterOneGuess = applyGuess(createGuessingState(puzzle.id), australia, answer);

describe("saved game state", () => {
  it("restores the saved state for the same day and puzzle", () => {
    const store = createMemoryStore();
    expect(storage.saveState(7, afterOneGuess, store)).toBe(true);
    expect(storage.findSavedState(puzzle.id, 7, store)).toEqual(afterOneGuess);
  });

  it("ignores a save from another day", () => {
    const store = createMemoryStore();
    storage.saveState(7, afterOneGuess, store);
    expect(storage.findSavedState(puzzle.id, 8, store)).toBeNull();
  });

  it("ignores a save for another puzzle", () => {
    const store = createMemoryStore();
    storage.saveState(7, afterOneGuess, store);
    expect(storage.findSavedState(otherPuzzle.id, 7, store)).toBeNull();
  });

  it("returns null when nothing is saved", () => {
    expect(storage.findSavedState(puzzle.id, 7, createMemoryStore())).toBeNull();
  });

  it("returns null for corrupted data", () => {
    const store = createMemoryStore({ [storage.keys.game]: "{broken" });
    expect(storage.findSavedState(puzzle.id, 7, store)).toBeNull();
  });

  it("returns null for data with the wrong shape", () => {
    const wrongStatus = { dayIndex: 7, state: { ...afterOneGuess, status: "cheating" } };
    const store = createMemoryStore({ [storage.keys.game]: JSON.stringify(wrongStatus) });
    expect(storage.findSavedState(puzzle.id, 7, store)).toBeNull();
  });

  it("returns null when a guess has an unknown direction", () => {
    const badGuess = {
      countryCode: "AU",
      feedback: { distanceKm: 10, direction: "UP", isCorrect: false },
    };
    const tampered = { dayIndex: 7, state: { ...afterOneGuess, guesses: [badGuess] } };
    const store = createMemoryStore({ [storage.keys.game]: JSON.stringify(tampered) });
    expect(storage.findSavedState(puzzle.id, 7, store)).toBeNull();
  });

  it("restores a won game whose correct guess has no distance or direction", () => {
    const won = applyGuess(createGuessingState(puzzle.id), answer, answer);
    const store = createMemoryStore();
    storage.saveState(7, won, store);
    expect(storage.findSavedState(puzzle.id, 7, store)).toEqual(won);
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
    const store = createMemoryStore({ [storage.keys.game]: JSON.stringify(legacy) });
    expect(storage.findSavedState(puzzle.id, 7, store)?.status).toBe("won");
  });

  it("returns null when a wrong guess is missing its distance or direction", () => {
    const withoutDistance = { countryCode: "AU", feedback: { isCorrect: false, direction: "N" } };
    const withoutDirection = { countryCode: "AU", feedback: { isCorrect: false, distanceKm: 10 } };
    [withoutDistance, withoutDirection].forEach((guess) => {
      const tampered = { dayIndex: 7, state: { ...afterOneGuess, guesses: [guess] } };
      const store = createMemoryStore({ [storage.keys.game]: JSON.stringify(tampered) });
      expect(storage.findSavedState(puzzle.id, 7, store)).toBeNull();
    });
  });

  it("returns null when isCorrect is not a boolean", () => {
    const badGuess = { countryCode: "AU", feedback: { isCorrect: "yes" } };
    const tampered = { dayIndex: 7, state: { ...afterOneGuess, guesses: [badGuess] } };
    const store = createMemoryStore({ [storage.keys.game]: JSON.stringify(tampered) });
    expect(storage.findSavedState(puzzle.id, 7, store)).toBeNull();
  });

  it("returns null when there are more guesses than allowed", () => {
    const guesses = Array.from({ length: 6 }, () => afterOneGuess.guesses[0]);
    const tampered = { dayIndex: 7, state: { ...afterOneGuess, guesses } };
    const store = createMemoryStore({ [storage.keys.game]: JSON.stringify(tampered) });
    expect(storage.findSavedState(puzzle.id, 7, store)).toBeNull();
  });
});

describe("help seen flag", () => {
  it("is false until marked, then true", () => {
    const store = createMemoryStore();
    expect(storage.hasSeenHelp(store)).toBe(false);
    expect(storage.markHelpSeen(store)).toBe(true);
    expect(storage.hasSeenHelp(store)).toBe(true);
  });

  it("ignores unexpected stored values", () => {
    const store = createMemoryStore({ [storage.keys.helpSeen]: JSON.stringify("yes") });
    expect(storage.hasSeenHelp(store)).toBe(false);
  });

  it("is false without a store", () => {
    expect(storage.hasSeenHelp(null)).toBe(false);
  });
});

describe("saved game stats", () => {
  it("returns empty stats when nothing is saved", () => {
    expect(storage.loadStats(createMemoryStore())).toEqual(createEmptyStats());
  });

  it("round-trips stats", () => {
    const store = createMemoryStore();
    const stats = applyGameResult(createEmptyStats(), 7, true);
    expect(storage.saveStats(stats, store)).toBe(true);
    expect(storage.loadStats(store)).toEqual(stats);
  });

  it("falls back to empty stats for corrupted data", () => {
    const store = createMemoryStore({ [storage.keys.stats]: "nope" });
    expect(storage.loadStats(store)).toEqual(createEmptyStats());
  });
});
