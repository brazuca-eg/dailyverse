import { describe, expect, it } from "vitest";
import { createMemoryStore } from "../../core/testing";
import { isWeatherState, weatherWindowStorage } from "./persistence";

const state = {
  puzzleId: "medium:3",
  phase: "plan" as const,
  plan: [1, -1, 4],
  peeksUsed: 1,
  status: "playing" as const,
};

describe("isWeatherState", () => {
  it("accepts a valid state in every phase and status", () => {
    expect(isWeatherState(state)).toBe(true);
    ["intro", "memorise", "plan", "done"].forEach((phase) => {
      expect(isWeatherState({ ...state, phase })).toBe(true);
    });
    ["won", "lost"].forEach((status) => expect(isWeatherState({ ...state, status })).toBe(true));
  });

  it("accepts two to four trips", () => {
    expect(isWeatherState({ ...state, plan: [0, 1] })).toBe(true);
    expect(isWeatherState({ ...state, plan: [0, 1, 2, 3] })).toBe(true);
  });

  it("rejects things that are not a state", () => {
    expect(isWeatherState(null)).toBe(false);
    expect(isWeatherState("state")).toBe(false);
    expect(isWeatherState({})).toBe(false);
    expect(isWeatherState([state])).toBe(false);
  });

  it("rejects a wrong field", () => {
    expect(isWeatherState({ ...state, puzzleId: 4 })).toBe(false);
    expect(isWeatherState({ ...state, phase: "later" })).toBe(false);
    expect(isWeatherState({ ...state, status: "cheating" })).toBe(false);
    expect(isWeatherState({ ...state, plan: "x" })).toBe(false);
  });

  it("rejects a plan of the wrong size or with days that cannot exist", () => {
    expect(isWeatherState({ ...state, plan: [0] })).toBe(false);
    expect(isWeatherState({ ...state, plan: [0, 1, 2, 3, 4] })).toBe(false);
    expect(isWeatherState({ ...state, plan: [0, 1, 7] })).toBe(false);
    expect(isWeatherState({ ...state, plan: [0, 1, -2] })).toBe(false);
    expect(isWeatherState({ ...state, plan: [0, 1, 1.5] })).toBe(false);
  });

  it("rejects negative or fractional peeks", () => {
    expect(isWeatherState({ ...state, peeksUsed: -1 })).toBe(false);
    expect(isWeatherState({ ...state, peeksUsed: 0.5 })).toBe(false);
  });
});

describe("weatherWindowStorage", () => {
  it("stores under its own keys", () => {
    expect(weatherWindowStorage.keys).toEqual({
      game: "dailyverse:weather-window:game",
      helpSeen: "dailyverse:weather-window:help-seen",
      stats: "dailyverse:weather-window:stats",
    });
  });

  it("saves a state and finds it again for the same day and puzzle only", () => {
    const store = createMemoryStore();
    weatherWindowStorage.saveState(4, state, store);
    expect(weatherWindowStorage.findSavedState("medium:3", 4, store)).toEqual(state);
    expect(weatherWindowStorage.findSavedState("medium:3", 5, store)).toBeNull();
    expect(weatherWindowStorage.findSavedState("hard:3", 4, store)).toBeNull();
  });

  it("ignores a saved state that is not valid", () => {
    const store = createMemoryStore();
    weatherWindowStorage.saveState(4, { ...state, plan: [9, 9] }, store);
    expect(weatherWindowStorage.findSavedState("medium:3", 4, store)).toBeNull();
  });
});
