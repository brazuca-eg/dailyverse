import { describe, expect, it } from "vitest";
import { createMemoryStore } from "../../core/testing";
import { createInitialState } from "./game";
import { isSudokuState, trailSudokuStorage } from "./persistence";

const state = {
  ...createInitialState("easy:3", 6),
  entries: Array.from({ length: 36 }, (_, index) => index % 7),
  notes: Array.from({ length: 36 }, (_, index) => index % 3),
  flagged: [2, 5],
  moves: [{ index: 4, entry: 0, notes: 2 }],
  checks: 1,
  hints: 2,
  elapsedSeconds: 75.5,
};

describe("isSudokuState", () => {
  it("accepts a valid 6x6 and 9x9 state", () => {
    expect(isSudokuState(state)).toBe(true);
    expect(isSudokuState(createInitialState("hard:2", 9))).toBe(true);
  });

  it("rejects things that are not a state", () => {
    expect(isSudokuState(null)).toBe(false);
    expect(isSudokuState("state")).toBe(false);
    expect(isSudokuState({})).toBe(false);
    expect(isSudokuState([state])).toBe(false);
  });

  it("rejects a wrong field", () => {
    expect(isSudokuState({ ...state, puzzleId: 4 })).toBe(false);
    expect(isSudokuState({ ...state, entries: "x" })).toBe(false);
    expect(isSudokuState({ ...state, flagged: "x" })).toBe(false);
    expect(isSudokuState({ ...state, moves: "x" })).toBe(false);
    expect(isSudokuState({ ...state, status: "cheating" })).toBe(false);
  });

  it("rejects grids of the wrong length, or notes that do not match the entries", () => {
    expect(isSudokuState({ ...state, entries: [0, 1], notes: [0, 1] })).toBe(false);
    expect(isSudokuState({ ...state, notes: state.notes.slice(1) })).toBe(false);
  });

  it("rejects negative or fractional numbers", () => {
    expect(isSudokuState({ ...state, entries: [...state.entries.slice(1), -1] })).toBe(false);
    expect(isSudokuState({ ...state, notes: [...state.notes.slice(1), 1.5] })).toBe(false);
    expect(isSudokuState({ ...state, flagged: [-1] })).toBe(false);
    expect(isSudokuState({ ...state, moves: [{ index: 1.5, entry: 0, notes: 0 }] })).toBe(false);
    expect(isSudokuState({ ...state, moves: [{ index: 1, entry: -1, notes: 0 }] })).toBe(false);
    expect(isSudokuState({ ...state, checks: -1 })).toBe(false);
    expect(isSudokuState({ ...state, hints: 1.5 })).toBe(false);
    expect(isSudokuState({ ...state, elapsedSeconds: -3 })).toBe(false);
    expect(isSudokuState({ ...state, elapsedSeconds: "slow" })).toBe(false);
  });
});

describe("trailSudokuStorage", () => {
  it("stores under its own keys", () => {
    expect(trailSudokuStorage.keys).toEqual({
      game: "dailyverse:trail-sudoku:game",
      helpSeen: "dailyverse:trail-sudoku:help-seen",
      stats: "dailyverse:trail-sudoku:stats",
    });
  });

  it("saves and restores a state for the same day and puzzle only", () => {
    const store = createMemoryStore();
    trailSudokuStorage.saveState(4, state, store);
    expect(trailSudokuStorage.findSavedState("easy:3", 4, store)).toEqual(state);
    expect(trailSudokuStorage.findSavedState("easy:3", 5, store)).toBeNull();
    expect(trailSudokuStorage.findSavedState("easy:4", 4, store)).toBeNull();
  });
});
