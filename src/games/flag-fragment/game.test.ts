import { describe, expect, it } from "vitest";
import { requireCountry } from "../../core/testing";
import { applyGuess, MAX_GUESSES, type GuessingState } from "../../core/guessing";
import { createInitialState, resolveRevealStage, REVEAL_STAGES } from "./game";

const answer = requireCountry("PT");
const wrongCodes = ["AU", "EG", "JP", "CH", "BR"];

function guessWrong(state: GuessingState, times: number): GuessingState {
  return wrongCodes
    .slice(0, times)
    .reduce((current, code) => applyGuess(current, requireCountry(code), answer), state);
}

describe("createInitialState", () => {
  it("identifies the round by day and flag so a saved game cannot match another day", () => {
    expect(createInitialState("PT", 4).puzzleId).toBe("4:PT");
    expect(createInitialState("PT", 5).puzzleId).not.toBe(createInitialState("PT", 4).puzzleId);
  });

  it("starts playing with no guesses", () => {
    const state = createInitialState("PT", 0);
    expect(state.status).toBe("playing");
    expect(state.guesses).toEqual([]);
  });
});

describe("resolveRevealStage", () => {
  it("has one stage per guess, ending with the full flag", () => {
    expect(REVEAL_STAGES).toHaveLength(MAX_GUESSES);
    expect(REVEAL_STAGES[MAX_GUESSES - 1]).toBe("full");
  });

  it("starts with the small crop and reveals more after each wrong guess", () => {
    const initial = createInitialState("PT", 0);
    expect(resolveRevealStage(initial)).toBe("crop-small");
    expect(resolveRevealStage(guessWrong(initial, 1))).toBe("crop-large");
    expect(resolveRevealStage(guessWrong(initial, 2))).toBe("blurred");
    expect(resolveRevealStage(guessWrong(initial, 3))).toBe("greyscale");
    expect(resolveRevealStage(guessWrong(initial, 4))).toBe("full");
  });

  it("shows the full flag once the round is won", () => {
    const won = applyGuess(createInitialState("PT", 0), answer, answer);
    expect(resolveRevealStage(won)).toBe("full");
  });

  it("shows the full flag once the round is lost", () => {
    const lost = guessWrong(createInitialState("PT", 0), MAX_GUESSES);
    expect(resolveRevealStage(lost)).toBe("full");
  });
});
