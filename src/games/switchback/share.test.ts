import { describe, expect, it } from "vitest";
import { buildShareText } from "./share";
import type { SwitchbackState } from "./game";

const base: SwitchbackState = {
  puzzleId: "easy:3",
  path: [0],
  hints: 0,
  elapsedSeconds: 72,
  status: "won",
};

describe("buildShareText", () => {
  it("shows the day, size, time and hints for a win", () => {
    expect(buildShareText(base, 6, 7).split("\n")).toEqual([
      "Dailyverse Switchback #7 · 6x6 · summit reached",
      "⏱ 1:12 · 💡 0 hints",
    ]);
  });

  it("says gave up for a loss", () => {
    expect(buildShareText({ ...base, status: "lost" }, 7, 12).split("\n")[0]).toBe(
      "Dailyverse Switchback #12 · 7x7 · gave up",
    );
  });

  it("uses the singular for one hint", () => {
    expect(buildShareText({ ...base, hints: 1 }, 5, 1)).toContain("💡 1 hint");
    expect(buildShareText({ ...base, hints: 1 }, 5, 1)).not.toContain("hints");
  });

  it("adds the link on its own last line", () => {
    const lines = buildShareText(base, 5, 3, "https://dailyverse.example/switchback").split("\n");
    expect(lines[lines.length - 1]).toBe("https://dailyverse.example/switchback");
    expect(lines).toHaveLength(3);
  });

  it("gives away nothing about the route", () => {
    expect(buildShareText({ ...base, path: [0, 1, 2, 3] }, 5, 3)).not.toContain("0,1");
  });
});
