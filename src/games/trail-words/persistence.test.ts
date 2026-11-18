import { describe, expect, it } from "vitest";
import { createMemoryStore } from "../../core/testing";
import { createInitialState } from "./game";
import { isTrailState, trailWordsStorage } from "./persistence";

const state = { puzzleId: "aeglnrt", found: ["trail", "gleam"], ended: false };

describe("isTrailState", () => {
  it("accepts a valid state", () => {
    expect(isTrailState(state)).toBe(true);
    expect(isTrailState(createInitialState("p"))).toBe(true);
  });

  it("rejects things that are not a state", () => {
    expect(isTrailState(null)).toBe(false);
    expect(isTrailState("state")).toBe(false);
    expect(isTrailState({})).toBe(false);
  });

  it("rejects a wrong field", () => {
    expect(isTrailState({ ...state, puzzleId: 4 })).toBe(false);
    expect(isTrailState({ ...state, found: "trail" })).toBe(false);
    expect(isTrailState({ ...state, found: [4] })).toBe(false);
    expect(isTrailState({ ...state, ended: "yes" })).toBe(false);
  });

  it("rejects found words that cannot be real answers", () => {
    expect(isTrailState({ ...state, found: ["cat"] })).toBe(false);
    expect(isTrailState({ ...state, found: ["Trail"] })).toBe(false);
    expect(isTrailState({ ...state, found: ["tra il"] })).toBe(false);
  });

  it("rejects the same word found twice", () => {
    expect(isTrailState({ ...state, found: ["trail", "trail"] })).toBe(false);
  });
});

describe("trailWordsStorage", () => {
  it("stores under its own keys", () => {
    expect(trailWordsStorage.keys).toEqual({
      game: "dailyverse:trail-words:game",
      helpSeen: "dailyverse:trail-words:help-seen",
      stats: "dailyverse:trail-words:stats",
    });
  });

  it("saves and restores a state for the same day and puzzle only", () => {
    const store = createMemoryStore();
    trailWordsStorage.saveState(4, state, store);
    expect(trailWordsStorage.findSavedState("aeglnrt", 4, store)).toEqual(state);
    expect(trailWordsStorage.findSavedState("aeglnrt", 5, store)).toBeNull();
    expect(trailWordsStorage.findSavedState("other", 4, store)).toBeNull();
  });
});
