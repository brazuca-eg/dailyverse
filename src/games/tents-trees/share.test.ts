import { describe, expect, it } from "vitest";
import { createInitialState, type TentsState } from "./game";
import { buildShareText } from "./share";

function stateWith(overrides: Partial<TentsState>): TentsState {
  return { ...createInitialState("2000:easy", 6), ...overrides };
}

describe("buildShareText", () => {
  it("shows the day, the grid size, the time and how much help was used", () => {
    expect(buildShareText(stateWith({ status: "won", elapsedSeconds: 222 }), 6, 4)).toBe(
      "Dailyverse Tents and Trees #4 6x6 ⛺\n⏱ 3:42 · 🔎 0 checks · 💡 0 hints",
    );
  });

  it("uses the singular for one check or one hint", () => {
    const text = buildShareText(
      stateWith({ status: "won", checks: 1, hints: 1, elapsedSeconds: 61 }),
      8,
      2,
    );
    expect(text.split("\n")[1]).toBe("⏱ 1:01 · 🔎 1 check · 💡 1 hint");
  });

  it("says the round was given up", () => {
    expect(
      buildShareText(stateWith({ status: "lost", elapsedSeconds: 59 }), 10, 12).split("\n")[0],
    ).toBe("Dailyverse Tents and Trees #12 10x10 gave up");
  });

  it("pads the seconds and ignores fractions of a second", () => {
    expect(
      buildShareText(stateWith({ status: "won", elapsedSeconds: 5.9 }), 6, 1).split("\n")[1],
    ).toContain("⏱ 0:05");
    expect(
      buildShareText(stateWith({ status: "won", elapsedSeconds: 600 }), 6, 1).split("\n")[1],
    ).toContain("⏱ 10:00");
  });

  it("appends the page address when given one", () => {
    const lines = buildShareText(
      stateWith({ status: "won" }),
      6,
      1,
      "https://example.com/tents-and-trees",
    ).split("\n");
    expect(lines).toHaveLength(3);
    expect(lines[2]).toBe("https://example.com/tents-and-trees");
  });

  it("does not say where any tent is", () => {
    const text = buildShareText(
      stateWith({ status: "won", marks: Array.from({ length: 36 }, () => 1) }),
      6,
      1,
    );
    expect(text).not.toMatch(/row|column/i);
    expect(text.split("\n")).toHaveLength(2);
  });
});
