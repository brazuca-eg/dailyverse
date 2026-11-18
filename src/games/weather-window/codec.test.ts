import { describe, expect, it } from "vitest";
import { decodePuzzle, encodePuzzle } from "./codec";
import { OBVIOUS } from "./fixtures";

describe("codec", () => {
  it("turns a puzzle into the stored form and back", () => {
    const stored = encodePuzzle(OBVIOUS);
    expect(stored).toEqual({ w: OBVIOUS.weather, t: OBVIOUS.trips });
    expect(decodePuzzle(stored)).toEqual(OBVIOUS);
  });

  it("does not share its lists with the puzzle", () => {
    const stored = encodePuzzle(OBVIOUS);
    expect(stored.w).not.toBe(OBVIOUS.weather);
    expect(stored.t).not.toBe(OBVIOUS.trips);
  });
});
