import { describe, expect, it } from "vitest";
import { createGameStorage } from "../../core/gameStorage";
import { createMemoryStore } from "../../core/testing";
import { createInitialState } from "./game";
import { isTentsState, tentsTreesStorage } from "./persistence";

const state = {
  ...createInitialState("2003:medium", 8),
  marks: Array.from({ length: 64 }, (_, index) => index % 3),
  moves: [{ index: 4, before: 0, after: 1 }],
  checks: 1,
  hints: 2,
  elapsedSeconds: 75.5,
};

describe("isTentsState", () => {
  it("accepts a valid state", () => {
    expect(isTentsState(state)).toBe(true);
    expect(isTentsState(createInitialState("p", 6))).toBe(true);
  });

  it("rejects things that are not a state", () => {
    expect(isTentsState(null)).toBe(false);
    expect(isTentsState("state")).toBe(false);
    expect(isTentsState({})).toBe(false);
  });

  it("rejects a wrong field", () => {
    expect(isTentsState({ ...state, puzzleId: 4 })).toBe(false);
    expect(isTentsState({ ...state, marks: "tents" })).toBe(false);
    expect(isTentsState({ ...state, marks: [0, 1, 7] })).toBe(false);
    expect(isTentsState({ ...state, moves: [{ index: "a", before: 0, after: 1 }] })).toBe(false);
    expect(isTentsState({ ...state, moves: [{ index: 1, before: 0, after: 5 }] })).toBe(false);
    expect(isTentsState({ ...state, status: "cheating" })).toBe(false);
  });

  it("rejects negative or fractional counts and a negative time", () => {
    expect(isTentsState({ ...state, checks: -1 })).toBe(false);
    expect(isTentsState({ ...state, hints: 1.5 })).toBe(false);
    expect(isTentsState({ ...state, elapsedSeconds: -3 })).toBe(false);
    expect(isTentsState({ ...state, elapsedSeconds: "slow" })).toBe(false);
  });
});

describe("tentsTreesStorage", () => {
  it("stores under its own keys", () => {
    expect(tentsTreesStorage.keys).toEqual({
      game: "dailyverse:tents-trees:game",
      helpSeen: "dailyverse:tents-trees:help-seen",
      stats: "dailyverse:tents-trees:stats",
    });
  });

  it("restores a round saved for the same day and puzzle", () => {
    const store = createMemoryStore();
    tentsTreesStorage.saveState(7, state, store);
    expect(tentsTreesStorage.findSavedState("2003:medium", 7, store)).toEqual(state);
  });

  it("ignores a round saved for another day or puzzle", () => {
    const store = createMemoryStore();
    tentsTreesStorage.saveState(7, state, store);
    expect(tentsTreesStorage.findSavedState("2003:medium", 8, store)).toBeNull();
    expect(tentsTreesStorage.findSavedState("2004:hard", 7, store)).toBeNull();
  });

  it("ignores corrupted saves", () => {
    const store = createMemoryStore({
      [tentsTreesStorage.keys.game]: JSON.stringify({
        dayIndex: 7,
        state: { puzzleId: "2003:medium", marks: 5 },
      }),
    });
    expect(tentsTreesStorage.findSavedState("2003:medium", 7, store)).toBeNull();
  });

  it("keeps its progress apart from the other games", () => {
    const store = createMemoryStore();
    tentsTreesStorage.saveState(7, state, store);
    expect(createGameStorage("mystery-place").findSavedState("2003:medium", 7, store)).toBeNull();
    expect(createGameStorage("flag-fragment").hasSeenHelp(store)).toBe(false);
  });
});
