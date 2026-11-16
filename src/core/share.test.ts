import { describe, expect, it } from "vitest";
import { applyGuess, createGuessingState, type GuessingState } from "./guessing";
import { buildShareText as buildShare } from "./share";
import { requireCountry } from "./testing";

const puzzle = { id: "puzzle-1", country: "PT" };
const answer = requireCountry(puzzle.country);
const buildShareText = (state: GuessingState, number: number, url?: string) =>
  buildShare("Mystery Place", state, number, url);

function playGuesses(codes: string[]): GuessingState {
  return codes.reduce((state, code) => {
    const guess = requireCountry(code);
    return applyGuess(state, guess, answer);
  }, createGuessingState(puzzle.id));
}

describe("buildShareText", () => {
  it("shows the score and a green square for a win", () => {
    const won = playGuesses(["AU", "EG", puzzle.country]);
    const lines = buildShareText(won, 3).split("\n");
    expect(lines[0]).toBe("Dailyverse Mystery Place #3 3/5");
    expect(lines[1].endsWith("🟩")).toBe(true);
    expect(lines[1].split(" ")).toHaveLength(3);
  });

  it("shows X/5 and only direction arrows for a loss", () => {
    const lost = playGuesses(["AU", "EG", "JP", "CH", "BR"]);
    const lines = buildShareText(lost, 12).split("\n");
    expect(lines[0]).toBe("Dailyverse Mystery Place #12 X/5");
    expect(lines[1]).not.toContain("🟩");
    expect(lines[1].split(" ")).toHaveLength(5);
  });

  it("appends the url when given", () => {
    const won = playGuesses([puzzle.country]);
    const lines = buildShareText(won, 1, "https://example.com/mystery-place").split("\n");
    expect(lines).toHaveLength(3);
    expect(lines[2]).toBe("https://example.com/mystery-place");
  });

  it("omits the url line when not given", () => {
    expect(buildShareText(playGuesses([puzzle.country]), 1).split("\n")).toHaveLength(2);
  });

  it("does not reveal the answer or the guessed countries", () => {
    const lost = playGuesses(["AU", "EG", "JP", "CH", "BR"]);
    const text = buildShareText(lost, 1).toLowerCase();
    for (const name of ["new zealand", "australia", "egypt", "japan", "switzerland", "brazil"]) {
      expect(text).not.toContain(name);
    }
  });
});
