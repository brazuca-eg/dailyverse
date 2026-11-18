import { describe, expect, it } from "vitest";
import { decodePuzzle, encodePuzzle } from "./codec";
import type { SwitchbackPuzzle } from "./types";

const puzzle: SwitchbackPuzzle = {
  size: 5,
  marks: [3, 12, 24],
  walls: [
    [1, 2],
    [6, 11],
  ],
};

describe("puzzle codec", () => {
  it("flattens fences into pairs of numbers and back", () => {
    expect(encodePuzzle(puzzle)).toEqual({ m: [3, 12, 24], w: [1, 2, 6, 11] });
    expect(decodePuzzle(5, encodePuzzle(puzzle))).toEqual(puzzle);
  });

  it("copes with no fences", () => {
    const plain: SwitchbackPuzzle = { size: 5, marks: [0, 24], walls: [] };
    expect(encodePuzzle(plain).w).toEqual([]);
    expect(decodePuzzle(5, encodePuzzle(plain))).toEqual(plain);
  });

  it("does not change what it is given", () => {
    const copy = structuredClone(puzzle);
    encodePuzzle(puzzle);
    expect(puzzle).toEqual(copy);
  });
});
