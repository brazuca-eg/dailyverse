import { describe, expect, it } from "vitest";
import { createInitialState, giveUp } from "./game";
import { buildShareText } from "./share";

const base = { ...createInitialState("easy:3", 6), elapsedSeconds: 192, checks: 1, hints: 0 };

describe("buildShareText", () => {
  it("shows the day, size, time, checks and hints for a win", () => {
    expect(buildShareText({ ...base, status: "won" }, 6, 7).split("\n")).toEqual([
      "Dailyverse Trail Sudoku #7 · 6x6 · solved",
      "⏱ 3:12 · 🔎 1 check · 💡 0 hints",
    ]);
  });

  it("says gave up for a loss", () => {
    expect(buildShareText(giveUp(base), 9, 12).split("\n")[0]).toBe(
      "Dailyverse Trail Sudoku #12 · 9x9 · gave up",
    );
  });

  it("uses plurals correctly", () => {
    const text = buildShareText({ ...base, status: "won", checks: 2, hints: 1 }, 6, 1);
    expect(text).toContain("🔎 2 checks · 💡 1 hint");
  });

  it("adds the link on its own last line", () => {
    const lines = buildShareText(
      { ...base, status: "won" },
      6,
      3,
      "https://dailyverse.example/trail-sudoku",
    ).split("\n");
    expect(lines[lines.length - 1]).toBe("https://dailyverse.example/trail-sudoku");
    expect(lines).toHaveLength(3);
  });

  it("gives away no digit of the puzzle", () => {
    const text = buildShareText({ ...base, status: "won" }, 6, 7);
    expect(text).not.toMatch(/[1-9]{6}/);
  });
});
