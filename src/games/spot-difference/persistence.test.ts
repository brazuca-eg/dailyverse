import { describe, expect, it } from "vitest";
import { createGameStorage } from "../../core/gameStorage";
import { createMemoryStore } from "../../core/testing";
import { createInitialState } from "./game";
import { isSpotState, spotDifferenceStorage } from "./persistence";

const state = { ...createInitialState("1003:hard"), found: ["pine-1", "rock-2"], mistakes: 1 };

describe("isSpotState", () => {
  it("accepts a valid state", () => {
    expect(isSpotState(state)).toBe(true);
    expect(isSpotState(createInitialState("p"))).toBe(true);
  });

  it("rejects things that are not a state", () => {
    expect(isSpotState(null)).toBe(false);
    expect(isSpotState("state")).toBe(false);
    expect(isSpotState({})).toBe(false);
  });

  it("rejects a state with a wrong field", () => {
    expect(isSpotState({ ...state, puzzleId: 4 })).toBe(false);
    expect(isSpotState({ ...state, found: "pine-1" })).toBe(false);
    expect(isSpotState({ ...state, found: [1, 2] })).toBe(false);
    expect(isSpotState({ ...state, status: "cheating" })).toBe(false);
  });

  it("rejects too many found differences and impossible mistake counts", () => {
    expect(isSpotState({ ...state, found: ["a", "b", "c", "d", "e", "f"] })).toBe(false);
    expect(isSpotState({ ...state, mistakes: -1 })).toBe(false);
    expect(isSpotState({ ...state, mistakes: 4 })).toBe(false);
    expect(isSpotState({ ...state, mistakes: 1.5 })).toBe(false);
  });
});

describe("spotDifferenceStorage", () => {
  it("stores under its own keys", () => {
    expect(spotDifferenceStorage.keys).toEqual({
      game: "dailyverse:spot-difference:game",
      helpSeen: "dailyverse:spot-difference:help-seen",
      stats: "dailyverse:spot-difference:stats",
    });
  });

  it("restores a round saved for the same day and puzzle", () => {
    const store = createMemoryStore();
    spotDifferenceStorage.saveState(7, state, store);
    expect(spotDifferenceStorage.findSavedState("1003:hard", 7, store)).toEqual(state);
  });

  it("ignores a round saved for another day or puzzle", () => {
    const store = createMemoryStore();
    spotDifferenceStorage.saveState(7, state, store);
    expect(spotDifferenceStorage.findSavedState("1003:hard", 8, store)).toBeNull();
    expect(spotDifferenceStorage.findSavedState("1004:easy", 7, store)).toBeNull();
  });

  it("ignores corrupted saves", () => {
    const store = createMemoryStore({
      [spotDifferenceStorage.keys.game]: JSON.stringify({
        dayIndex: 7,
        state: { puzzleId: "1003:hard", found: 3 },
      }),
    });
    expect(spotDifferenceStorage.findSavedState("1003:hard", 7, store)).toBeNull();
  });

  it("keeps its progress apart from the other games", () => {
    const store = createMemoryStore();
    spotDifferenceStorage.saveState(7, state, store);
    expect(createGameStorage("mystery-place").findSavedState("1003:hard", 7, store)).toBeNull();
    expect(createGameStorage("flag-fragment").hasSeenHelp(store)).toBe(false);
  });
});
