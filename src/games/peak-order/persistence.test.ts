import { describe, expect, it } from "vitest";
import { createMemoryStore } from "../../core/testing";
import { isPeakState, peakOrderStorage } from "./persistence";

const state = {
  puzzleId: "mountains:medium:3",
  order: [1, 0, 2, 3, 4],
  history: [[2, 1, 0, 3, 4]],
};

describe("isPeakState", () => {
  it("accepts a valid state, with or without checks, and a won or lost game", () => {
    expect(isPeakState(state)).toBe(true);
    expect(isPeakState({ ...state, history: [] })).toBe(true);
    expect(
      isPeakState({
        ...state,
        history: [
          [1, 0, 2, 3, 4],
          [0, 1, 2, 3, 4],
        ],
      }),
    ).toBe(true);
    const five = [
      [1, 0, 2, 3, 4],
      [2, 1, 0, 3, 4],
      [3, 1, 2, 0, 4],
      [4, 1, 2, 3, 0],
      [0, 2, 1, 3, 4],
    ];
    expect(isPeakState({ ...state, history: five })).toBe(true);
  });

  it("rejects things that are not a state", () => {
    expect(isPeakState(null)).toBe(false);
    expect(isPeakState("state")).toBe(false);
    expect(isPeakState({})).toBe(false);
    expect(isPeakState([state])).toBe(false);
  });

  it("rejects a wrong field", () => {
    expect(isPeakState({ ...state, puzzleId: 4 })).toBe(false);
    expect(isPeakState({ ...state, order: "01234" })).toBe(false);
    expect(isPeakState({ ...state, history: "none" })).toBe(false);
  });

  it("rejects an order that is not each item once", () => {
    expect(isPeakState({ ...state, order: [0, 1, 2, 3] })).toBe(false);
    expect(isPeakState({ ...state, order: [0, 1, 2, 3, 4, 5] })).toBe(false);
    expect(isPeakState({ ...state, order: [0, 0, 2, 3, 4] })).toBe(false);
    expect(isPeakState({ ...state, order: [0, 1, 2, 3, 5] })).toBe(false);
    expect(isPeakState({ ...state, order: [0, 1, 2, 3, "4"] })).toBe(false);
  });

  it("rejects a history with a bad order, or with more than five checks", () => {
    expect(isPeakState({ ...state, history: [[0, 0, 2, 3, 4]] })).toBe(false);
    const six = Array.from({ length: 6 }, (_, index) =>
      index % 2 === 0 ? [1, 0, 2, 3, 4] : [2, 1, 0, 3, 4],
    );
    expect(isPeakState({ ...state, history: six })).toBe(false);
  });

  it("rejects play that goes on after a win", () => {
    expect(
      isPeakState({
        ...state,
        history: [
          [0, 1, 2, 3, 4],
          [1, 0, 2, 3, 4],
        ],
      }),
    ).toBe(false);
  });

  it("rejects the same order checked twice in a row", () => {
    expect(
      isPeakState({
        ...state,
        history: [
          [1, 0, 2, 3, 4],
          [1, 0, 2, 3, 4],
        ],
      }),
    ).toBe(false);
  });
});

describe("peakOrderStorage", () => {
  it("stores under its own keys", () => {
    expect(peakOrderStorage.keys).toEqual({
      game: "dailyverse:peak-order:game",
      helpSeen: "dailyverse:peak-order:help-seen",
      stats: "dailyverse:peak-order:stats",
    });
  });

  it("saves and restores a state for the same day and puzzle only", () => {
    const store = createMemoryStore();
    peakOrderStorage.saveState(4, state, store);
    expect(peakOrderStorage.findSavedState(state.puzzleId, 4, store)).toEqual(state);
    expect(peakOrderStorage.findSavedState(state.puzzleId, 5, store)).toBeNull();
    expect(peakOrderStorage.findSavedState("lakes:hard:1", 4, store)).toBeNull();
  });
});
