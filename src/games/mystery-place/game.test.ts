import { describe, expect, it } from "vitest";
import { requireCountry } from "../../core/testing";
import { puzzles } from "./data";
import { applyGuess, MAX_GUESSES, type GuessingState } from "../../core/guessing";
import { countVisibleClues, createInitialState } from "./game";

const puzzle = puzzles[0];
const answer = requireCountry(puzzle.country);
const wrongCodes = ["AU", "EG", "JP", "CH", "BR"];

function guessWrong(state: GuessingState, times: number): GuessingState {
  return wrongCodes
    .slice(0, times)
    .reduce((current, code) => applyGuess(current, requireCountry(code), answer), state);
}

describe("createInitialState", () => {
  it("starts playing with no guesses", () => {
    expect(createInitialState(puzzle)).toEqual({
      puzzleId: puzzle.id,
      guesses: [],
      status: "playing",
    });
  });
});

describe("countVisibleClues", () => {
  const totalClues = puzzle.clues.length;

  it("shows one clue at the start and one more per wrong guess", () => {
    const initial = createInitialState(puzzle);
    expect(countVisibleClues(initial, totalClues)).toBe(1);
    expect(countVisibleClues(guessWrong(initial, 1), totalClues)).toBe(2);
    expect(countVisibleClues(guessWrong(initial, 4), totalClues)).toBe(5);
  });

  it("reveals every clue once the game is over", () => {
    const won = applyGuess(createInitialState(puzzle), answer, answer);
    expect(countVisibleClues(won, totalClues)).toBe(totalClues);
    const lost = guessWrong(createInitialState(puzzle), MAX_GUESSES);
    expect(countVisibleClues(lost, totalClues)).toBe(totalClues);
  });

  it("never shows more clues than exist", () => {
    const afterFour = guessWrong(createInitialState(puzzle), 4);
    expect(countVisibleClues(afterFour, 3)).toBe(3);
  });
});
