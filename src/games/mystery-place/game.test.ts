import { describe, expect, it } from "vitest";
import { requireCountry, requireIncorrect } from "../../core/testing";
import { puzzles } from "./data";
import {
  applyGuess,
  calculateScore,
  canSubmitGuess,
  countVisibleClues,
  createInitialState,
  MAX_GUESSES,
  type GameState,
} from "./game";

const puzzle = puzzles[0];
const answer = requireCountry(puzzle.country);
const wrongCodes = ["AU", "EG", "JP", "CH", "BR"];

function guessWrong(state: GameState, times: number): GameState {
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

describe("applyGuess", () => {
  it("wins immediately on a correct first guess", () => {
    const state = applyGuess(createInitialState(puzzle), answer, answer);
    expect(state.status).toBe("won");
    expect(state.guesses).toHaveLength(1);
    expect(state.guesses[0].feedback.isCorrect).toBe(true);
  });

  it("keeps playing after a wrong guess and records feedback", () => {
    const state = guessWrong(createInitialState(puzzle), 1);
    expect(state.status).toBe("playing");
    expect(state.guesses[0].countryCode).toBe("AU");
    expect(requireIncorrect(state.guesses[0].feedback).distanceKm).toBeGreaterThan(0);
  });

  it("loses after the maximum number of wrong guesses", () => {
    const state = guessWrong(createInitialState(puzzle), MAX_GUESSES);
    expect(state.status).toBe("lost");
    expect(state.guesses).toHaveLength(MAX_GUESSES);
  });

  it("wins on the last allowed guess", () => {
    const afterFourWrong = guessWrong(createInitialState(puzzle), MAX_GUESSES - 1);
    const state = applyGuess(afterFourWrong, answer, answer);
    expect(state.status).toBe("won");
  });

  it("does not mutate the previous state", () => {
    const initial = createInitialState(puzzle);
    applyGuess(initial, requireCountry("AU"), answer);
    expect(initial.guesses).toHaveLength(0);
    expect(initial.status).toBe("playing");
  });

  it("rejects a repeated guess", () => {
    const state = guessWrong(createInitialState(puzzle), 1);
    expect(canSubmitGuess(state, "AU")).toBe(false);
    expect(() => applyGuess(state, requireCountry("AU"), answer)).toThrow();
  });

  it("rejects guesses once the game is finished", () => {
    const won = applyGuess(createInitialState(puzzle), answer, answer);
    expect(canSubmitGuess(won, "AU")).toBe(false);
    expect(() => applyGuess(won, requireCountry("AU"), answer)).toThrow();
  });
});

describe("canSubmitGuess", () => {
  it("allows a new country while playing", () => {
    expect(canSubmitGuess(createInitialState(puzzle), "AU")).toBe(true);
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

describe("calculateScore", () => {
  it("gives the maximum for a first-guess win", () => {
    expect(calculateScore(applyGuess(createInitialState(puzzle), answer, answer))).toBe(5);
  });

  it("gives fewer points the later the win", () => {
    const thirdGuessWin = applyGuess(guessWrong(createInitialState(puzzle), 2), answer, answer);
    expect(calculateScore(thirdGuessWin)).toBe(3);
    const lastGuessWin = applyGuess(guessWrong(createInitialState(puzzle), 4), answer, answer);
    expect(calculateScore(lastGuessWin)).toBe(1);
  });

  it("gives zero for a loss or an unfinished game", () => {
    expect(calculateScore(guessWrong(createInitialState(puzzle), MAX_GUESSES))).toBe(0);
    expect(calculateScore(createInitialState(puzzle))).toBe(0);
  });
});
