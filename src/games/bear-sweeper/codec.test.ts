import { describe, expect, it } from "vitest";
import { decodePuzzle, encodePuzzle } from "./codec";
import type { BearPuzzle } from "./types";

const puzzle: BearPuzzle = { size: 7, bears: [3, 10, 25, 40], start: 16 };

describe("puzzle codec", () => {
  it("keeps the bears and the start, and takes the size from the tier", () => {
    expect(encodePuzzle(puzzle)).toEqual({ b: [3, 10, 25, 40], s: 16 });
    expect(decodePuzzle(7, encodePuzzle(puzzle))).toEqual(puzzle);
  });

  it("does not share the list it was given", () => {
    const stored = encodePuzzle(puzzle);
    expect(stored.b).not.toBe(puzzle.bears);
  });
});
