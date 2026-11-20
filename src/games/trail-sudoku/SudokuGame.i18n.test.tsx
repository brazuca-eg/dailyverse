import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { buildDailySudokuRound } from "./daily";
import { buildRuleSteps } from "./helpText";
import { gameMeta } from "./meta";
import { sudokuMessages } from "./messages";
import { buildShareText } from "./share";
import { createInitialState } from "./game";
import { SudokuGame } from "./SudokuGame";

const round = buildDailySudokuRound(0);

afterEach(() => {
  document.documentElement.lang = "";
});

describe("SudokuGame in German", () => {
  it("shows translated controls, cell labels and rules without raw keys", () => {
    document.documentElement.lang = "de";
    const { container } = render(<SudokuGame />);

    expect(screen.getAllByText(buildRuleSteps()[1]).length).toBeGreaterThan(0);
    expect(screen.getByRole("grid", { name: "Pfad-Sudoku-Spielfeld", hidden: true })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Löschen", hidden: true })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Aufgeben", hidden: true })).toBeTruthy();
    expect(screen.getByRole("button", { name: /^Zeile 1, Spalte 1,/, hidden: true })).toBeTruthy();
    expect(container.textContent).not.toMatch(/sudoku\.[a-z]+\./);
  });
});

describe("Trail Sudoku share text", () => {
  it("is translated, including the game title and plurals", () => {
    document.documentElement.lang = "uk";
    const text = buildShareText(
      {
        ...createInitialState("easy:0", 6),
        status: "won",
        elapsedSeconds: 65,
        checks: 2,
        hints: 5,
      },
      round.puzzle.size,
      4,
    );
    expect(text).toBe(
      `Dailyverse ${gameMeta("meta.sudoku.title")} #4 · 6x6 · розв'язано\n⏱ 1:05 · 🔎 2 перевірки · 💡 5 підказок`,
    );
  });
});

describe("Trail Sudoku messages", () => {
  it("never lets a rule step fall back to its key", () => {
    document.documentElement.lang = "fr";
    buildRuleSteps().forEach((step) => expect(step).not.toMatch(/^sudoku\./));
    expect(sudokuMessages("sudoku.pad.erase")).toBe("Effacer");
  });
});
