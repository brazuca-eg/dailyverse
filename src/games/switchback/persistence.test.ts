import { describe, expect, it } from "vitest";
import { createMemoryStore } from "../../core/testing";
import { isSwitchbackState, switchbackStorage } from "./persistence";

const state = {
  puzzleId: "easy:3",
  path: [0, 1, 2, 7],
  hints: 1,
  elapsedSeconds: 75.5,
  status: "playing" as const,
};

describe("isSwitchbackState", () => {
  it("accepts a valid state, also a won or lost one", () => {
    expect(isSwitchbackState(state)).toBe(true);
    expect(isSwitchbackState({ ...state, status: "won" })).toBe(true);
    expect(isSwitchbackState({ ...state, status: "lost" })).toBe(true);
  });

  it("rejects things that are not a state", () => {
    expect(isSwitchbackState(null)).toBe(false);
    expect(isSwitchbackState("state")).toBe(false);
    expect(isSwitchbackState({})).toBe(false);
    expect(isSwitchbackState([state])).toBe(false);
  });

  it("rejects a wrong field", () => {
    expect(isSwitchbackState({ ...state, puzzleId: 4 })).toBe(false);
    expect(isSwitchbackState({ ...state, path: "0123" })).toBe(false);
    expect(isSwitchbackState({ ...state, status: "cheating" })).toBe(false);
    expect(isSwitchbackState({ ...state, elapsedSeconds: "slow" })).toBe(false);
  });

  it("rejects a trail that is empty, too long or holds bad numbers", () => {
    expect(isSwitchbackState({ ...state, path: [] })).toBe(false);
    expect(
      isSwitchbackState({ ...state, path: Array.from({ length: 50 }, (_, index) => index) }),
    ).toBe(false);
    expect(
      isSwitchbackState({ ...state, path: Array.from({ length: 49 }, (_, index) => index) }),
    ).toBe(true);
    expect(isSwitchbackState({ ...state, path: [0, -1] })).toBe(false);
    expect(isSwitchbackState({ ...state, path: [0, 1.5] })).toBe(false);
  });

  it("rejects negative or fractional counts and a negative time", () => {
    expect(isSwitchbackState({ ...state, hints: -1 })).toBe(false);
    expect(isSwitchbackState({ ...state, hints: 1.5 })).toBe(false);
    expect(isSwitchbackState({ ...state, elapsedSeconds: -3 })).toBe(false);
  });
});

describe("switchbackStorage", () => {
  it("stores under its own keys", () => {
    expect(switchbackStorage.keys).toEqual({
      game: "dailyverse:switchback:game",
      helpSeen: "dailyverse:switchback:help-seen",
      stats: "dailyverse:switchback:stats",
    });
  });

  it("saves and restores a state for the same day and puzzle only", () => {
    const store = createMemoryStore();
    switchbackStorage.saveState(4, state, store);
    expect(switchbackStorage.findSavedState("easy:3", 4, store)).toEqual(state);
    expect(switchbackStorage.findSavedState("easy:3", 5, store)).toBeNull();
    expect(switchbackStorage.findSavedState("easy:4", 4, store)).toBeNull();
  });
});
