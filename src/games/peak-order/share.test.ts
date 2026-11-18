import { describe, expect, it } from "vitest";
import type { PeakState } from "./game";
import { buildPeakPuzzle } from "./puzzle";
import { buildShareText } from "./share";

const puzzle = buildPeakPuzzle("rivers", "hard", 2);
const WRONG = [
  [1, 0, 2, 3, 4],
  [0, 1, 2, 4, 3],
  [4, 3, 2, 1, 0],
  [2, 0, 1, 4, 3],
  [3, 4, 0, 1, 2],
];
const SOLVED = [0, 1, 2, 3, 4];

function stateWith(history: number[][]): PeakState {
  return { puzzleId: puzzle.id, order: [...(history[history.length - 1] ?? SOLVED)], history };
}

describe("buildShareText", () => {
  it("shows the day, the category and the checks used, with one row per check", () => {
    const text = buildShareText(puzzle, stateWith([WRONG[0], WRONG[1], SOLVED]), 7);
    expect(text.split("\n")).toEqual([
      "Dailyverse Peak Order #7 · Rivers · 3/5",
      "⬜⬜🟩🟩🟩",
      "🟩🟩🟩⬜⬜",
      "🟩🟩🟩🟩🟩",
    ]);
  });

  it("shows X for a loss", () => {
    const text = buildShareText(puzzle, stateWith(WRONG), 12);
    expect(text.split("\n")[0]).toBe("Dailyverse Peak Order #12 · Rivers · X/5");
    expect(text.split("\n")).toHaveLength(6);
  });

  it("shows a win on the first check", () => {
    expect(buildShareText(puzzle, stateWith([SOLVED]), 1).split("\n")[0]).toBe(
      "Dailyverse Peak Order #1 · Rivers · 1/5",
    );
  });

  it("gives away no item name or value", () => {
    const text = buildShareText(puzzle, stateWith([WRONG[0], SOLVED]), 7);
    puzzle.items.forEach((item) => {
      expect(text).not.toContain(item.name);
      expect(text).not.toContain(String(item.value));
    });
  });

  it("adds the link on its own last line", () => {
    const lines = buildShareText(
      puzzle,
      stateWith([SOLVED]),
      3,
      "https://dailyverse.example/peak-order",
    ).split("\n");
    expect(lines[lines.length - 1]).toBe("https://dailyverse.example/peak-order");
    expect(lines).toHaveLength(3);
  });

  it("uses the name of each category", () => {
    const lakes = buildPeakPuzzle("lakes", "medium", 0);
    expect(
      buildShareText(lakes, { puzzleId: lakes.id, order: SOLVED, history: [SOLVED] }, 2),
    ).toContain("· Lakes ·");
  });
});
