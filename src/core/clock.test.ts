import { describe, expect, it } from "vitest";
import { hasStartedPlaying } from "./clock";

const initial = { puzzleId: "p", marks: [0, 0, 0], hints: 0, elapsedSeconds: 0 };

describe("hasStartedPlaying", () => {
  it("is false for a game nobody touched", () => {
    expect(hasStartedPlaying({ ...initial }, initial)).toBe(false);
  });

  it("is true once anything on the board changed", () => {
    expect(hasStartedPlaying({ ...initial, marks: [0, 1, 0] }, initial)).toBe(true);
    expect(hasStartedPlaying({ ...initial, hints: 1 }, initial)).toBe(true);
  });

  it("is true once time has been counted, even if the board is back to the start", () => {
    expect(hasStartedPlaying({ ...initial, elapsedSeconds: 3 }, initial)).toBe(true);
  });

  it("does not depend on key order", () => {
    const reordered = { elapsedSeconds: 0, hints: 0, marks: [0, 0, 0], puzzleId: "p" };
    expect(hasStartedPlaying(reordered, initial)).toBe(false);
  });
});
