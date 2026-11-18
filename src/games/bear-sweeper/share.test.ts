import { describe, expect, it } from "vitest";
import { TRIGGERED, type BearState } from "./game";
import { buildShareText } from "./share";

const cells = Array.from({ length: 81 }, () => 0);
const base: BearState = {
  puzzleId: "medium:3",
  cells,
  hints: 0,
  elapsedSeconds: 161,
  status: "won",
};

describe("buildShareText", () => {
  it("shows the day, size, time, encounters and hints for a win", () => {
    const state = { ...base, cells: cells.map((cell, index) => (index === 4 ? TRIGGERED : cell)) };
    expect(buildShareText(state, 9, 7).split("\n")).toEqual([
      "Dailyverse Bear Sweeper #7 · 9x9 · ⏱ 2:41 · all clear",
      "🐻 1 encounter · 💡 0 hints",
    ]);
  });

  it("says chased off for a loss", () => {
    expect(buildShareText({ ...base, status: "lost" }, 11, 12).split("\n")[0]).toBe(
      "Dailyverse Bear Sweeper #12 · 11x11 · ⏱ 2:41 · chased off",
    );
  });

  it("uses plurals correctly", () => {
    const state = {
      ...base,
      hints: 2,
      cells: cells.map((cell, index) => (index < 2 ? TRIGGERED : cell)),
    };
    expect(buildShareText(state, 9, 1)).toContain("🐻 2 encounters · 💡 2 hints");
    expect(buildShareText({ ...base, hints: 1 }, 9, 1)).toContain("💡 1 hint");
  });

  it("adds the link on its own last line", () => {
    const lines = buildShareText(base, 9, 3, "https://dailyverse.example/bear-sweeper").split("\n");
    expect(lines[lines.length - 1]).toBe("https://dailyverse.example/bear-sweeper");
    expect(lines).toHaveLength(3);
  });
});
