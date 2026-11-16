import { describe, expect, it } from "vitest";
import { createGameStorage } from "../../core/gameStorage";
import { applyGameResult, createEmptyStats } from "../../core/streak";
import { createMemoryStore, requireCountry } from "../../core/testing";
import { applyGuess } from "../../core/guessing";
import { createInitialState } from "./game";
import { flagStorage } from "./persistence";

const answer = requireCountry("PT");
const state = applyGuess(createInitialState("PT", 7), requireCountry("AU"), answer);

describe("flag fragment persistence", () => {
  it("stores under its own keys", () => {
    expect(flagStorage.keys).toEqual({
      game: "dailyverse:flag-fragment:game",
      helpSeen: "dailyverse:flag-fragment:help-seen",
      stats: "dailyverse:flag-fragment:stats",
    });
  });

  it("restores a round saved for the same day and flag", () => {
    const store = createMemoryStore();
    flagStorage.saveState(7, state, store);
    expect(flagStorage.findSavedState(state.puzzleId, 7, store)).toEqual(state);
  });

  it("ignores a round saved for another day or flag", () => {
    const store = createMemoryStore();
    flagStorage.saveState(7, state, store);
    expect(flagStorage.findSavedState(state.puzzleId, 8, store)).toBeNull();
    expect(flagStorage.findSavedState("7:ES", 7, store)).toBeNull();
  });

  it("keeps progress and stats apart from Mystery Place", () => {
    const store = createMemoryStore();
    const mysteryPlace = createGameStorage("mystery-place");
    flagStorage.saveState(7, state, store);
    flagStorage.saveStats(applyGameResult(createEmptyStats(), 7, true), store);
    flagStorage.markHelpSeen(store);

    expect(mysteryPlace.findSavedState(state.puzzleId, 7, store)).toBeNull();
    expect(mysteryPlace.loadStats(store)).toEqual(createEmptyStats());
    expect(mysteryPlace.hasSeenHelp(store)).toBe(false);
  });

  it("keeps a streak that survives day by day", () => {
    const store = createMemoryStore();
    const dayOne = applyGameResult(flagStorage.loadStats(store), 7, true);
    flagStorage.saveStats(dayOne, store);
    const dayTwo = applyGameResult(flagStorage.loadStats(store), 8, true);
    expect(dayTwo.currentStreak).toBe(2);
  });
});
