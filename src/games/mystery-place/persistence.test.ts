import { describe, expect, it } from "vitest";
import { createMemoryStore, requireCountry } from "../../core/testing";
import { puzzles } from "./data";
import { applyGuess } from "../../core/guessing";
import { createInitialState } from "./game";
import { mysteryPlaceStorage } from "./persistence";

const puzzle = puzzles[0];
const state = applyGuess(
  createInitialState(puzzle),
  requireCountry("AU"),
  requireCountry(puzzle.country),
);

describe("mystery place persistence", () => {
  it("stores under its own keys", () => {
    expect(mysteryPlaceStorage.keys).toEqual({
      game: "dailyverse:mystery-place:game",
      helpSeen: "dailyverse:mystery-place:help-seen",
      stats: "dailyverse:mystery-place:stats",
    });
  });

  it("restores a save by puzzle and day", () => {
    const store = createMemoryStore();
    mysteryPlaceStorage.saveState(7, state, store);
    expect(mysteryPlaceStorage.findSavedState(puzzle.id, 7, store)).toEqual(state);
    expect(mysteryPlaceStorage.findSavedState(puzzles[1].id, 7, store)).toBeNull();
    expect(mysteryPlaceStorage.findSavedState(puzzle.id, 8, store)).toBeNull();
  });
});
