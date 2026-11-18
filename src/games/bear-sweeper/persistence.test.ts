import { describe, expect, it } from "vitest";
import { createMemoryStore } from "../../core/testing";
import { isBearState, bearSweeperStorage } from "./persistence";

const cells = Array.from({ length: 49 }, (_, index) => index % 4);
const state = {
  puzzleId: "easy:3",
  cells,
  hints: 1,
  elapsedSeconds: 75.5,
  status: "playing" as const,
};

describe("isBearState", () => {
  it("accepts a valid state for each grid size", () => {
    expect(isBearState(state)).toBe(true);
    expect(isBearState({ ...state, cells: Array.from({ length: 81 }, () => 0) })).toBe(true);
    expect(isBearState({ ...state, cells: Array.from({ length: 121 }, () => 3) })).toBe(true);
    expect(isBearState({ ...state, status: "won" })).toBe(true);
    expect(isBearState({ ...state, status: "lost" })).toBe(true);
  });

  it("rejects things that are not a state", () => {
    expect(isBearState(null)).toBe(false);
    expect(isBearState("state")).toBe(false);
    expect(isBearState({})).toBe(false);
    expect(isBearState([state])).toBe(false);
  });

  it("rejects a wrong field", () => {
    expect(isBearState({ ...state, puzzleId: 4 })).toBe(false);
    expect(isBearState({ ...state, cells: "x" })).toBe(false);
    expect(isBearState({ ...state, status: "cheating" })).toBe(false);
    expect(isBearState({ ...state, elapsedSeconds: "slow" })).toBe(false);
  });

  it("rejects a grid that is not a known size, or has codes that do not exist", () => {
    expect(isBearState({ ...state, cells: [0, 1, 2] })).toBe(false);
    expect(isBearState({ ...state, cells: [...cells.slice(1), 4] })).toBe(false);
    expect(isBearState({ ...state, cells: [...cells.slice(1), -1] })).toBe(false);
    expect(isBearState({ ...state, cells: [...cells.slice(1), 1.5] })).toBe(false);
  });

  it("rejects negative or fractional counts and a negative time", () => {
    expect(isBearState({ ...state, hints: -1 })).toBe(false);
    expect(isBearState({ ...state, hints: 1.5 })).toBe(false);
    expect(isBearState({ ...state, elapsedSeconds: -3 })).toBe(false);
  });
});

describe("bearSweeperStorage", () => {
  it("stores under its own keys", () => {
    expect(bearSweeperStorage.keys).toEqual({
      game: "dailyverse:bear-sweeper:game",
      helpSeen: "dailyverse:bear-sweeper:help-seen",
      stats: "dailyverse:bear-sweeper:stats",
    });
  });

  it("saves and restores a state for the same day and puzzle only", () => {
    const store = createMemoryStore();
    bearSweeperStorage.saveState(4, state, store);
    expect(bearSweeperStorage.findSavedState("easy:3", 4, store)).toEqual(state);
    expect(bearSweeperStorage.findSavedState("easy:3", 5, store)).toBeNull();
    expect(bearSweeperStorage.findSavedState("easy:4", 4, store)).toBeNull();
  });
});
