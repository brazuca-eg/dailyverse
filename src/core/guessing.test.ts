import { describe, expect, it } from "vitest";
import {
  applyGuess,
  calculateScore,
  canSubmitGuess,
  createGuessingState,
  MAX_GUESSES,
  type GuessingState,
} from "./guessing";
import { requireCountry, requireIncorrect } from "./testing";

const answer = requireCountry("PT");
const wrongCodes = ["AU", "EG", "JP", "CH", "BR"];

function createState(): GuessingState {
  return createGuessingState("puzzle-1");
}

function guessWrong(state: GuessingState, times: number): GuessingState {
  return wrongCodes
    .slice(0, times)
    .reduce((current, code) => applyGuess(current, requireCountry(code), answer), state);
}

describe("createGuessingState", () => {
  it("starts playing with no guesses", () => {
    expect(createState()).toEqual({ puzzleId: "puzzle-1", guesses: [], status: "playing" });
  });
});

describe("applyGuess", () => {
  it("wins immediately on a correct first guess", () => {
    const state = applyGuess(createState(), answer, answer);
    expect(state.status).toBe("won");
    expect(state.guesses).toHaveLength(1);
    expect(state.guesses[0].feedback.isCorrect).toBe(true);
  });

  it("keeps playing after a wrong guess and records feedback", () => {
    const state = guessWrong(createState(), 1);
    expect(state.status).toBe("playing");
    expect(state.guesses[0].countryCode).toBe("AU");
    expect(requireIncorrect(state.guesses[0].feedback).distanceKm).toBeGreaterThan(0);
  });

  it("loses after the maximum number of wrong guesses", () => {
    const state = guessWrong(createState(), MAX_GUESSES);
    expect(state.status).toBe("lost");
    expect(state.guesses).toHaveLength(MAX_GUESSES);
  });

  it("wins on the last allowed guess", () => {
    const afterFourWrong = guessWrong(createState(), MAX_GUESSES - 1);
    expect(applyGuess(afterFourWrong, answer, answer).status).toBe("won");
  });

  it("does not mutate the previous state", () => {
    const initial = createState();
    applyGuess(initial, requireCountry("AU"), answer);
    expect(initial.guesses).toHaveLength(0);
    expect(initial.status).toBe("playing");
  });

  it("rejects a repeated guess", () => {
    const state = guessWrong(createState(), 1);
    expect(canSubmitGuess(state, "AU")).toBe(false);
    expect(() => applyGuess(state, requireCountry("AU"), answer)).toThrow();
  });

  it("rejects guesses once the game is finished", () => {
    const won = applyGuess(createState(), answer, answer);
    expect(canSubmitGuess(won, "AU")).toBe(false);
    expect(() => applyGuess(won, requireCountry("AU"), answer)).toThrow();
  });
});

describe("canSubmitGuess", () => {
  it("allows a new country while playing", () => {
    expect(canSubmitGuess(createState(), "AU")).toBe(true);
  });
});

describe("calculateScore", () => {
  it("gives the maximum for a first-guess win", () => {
    expect(calculateScore(applyGuess(createState(), answer, answer))).toBe(5);
  });

  it("gives fewer points the later the win", () => {
    expect(calculateScore(applyGuess(guessWrong(createState(), 2), answer, answer))).toBe(3);
    expect(calculateScore(applyGuess(guessWrong(createState(), 4), answer, answer))).toBe(1);
  });

  it("gives zero for a loss or an unfinished game", () => {
    expect(calculateScore(guessWrong(createState(), MAX_GUESSES))).toBe(0);
    expect(calculateScore(createState())).toBe(0);
  });
});
