import { describe, expect, it } from "vitest";
import { decodePuzzle, encodePuzzle } from "./encode";
import { toLetterMask } from "./words";

describe("encodePuzzle", () => {
  it("puts the centre letter first, then the others in order", () => {
    expect(encodePuzzle(toLetterMask("adeglnr"), "g".charCodeAt(0) - 97)).toBe("gadelnr");
    expect(encodePuzzle(toLetterMask("adeglnr"), "a".charCodeAt(0) - 97)).toBe("adeglnr");
  });
});

describe("decodePuzzle", () => {
  it("reads the centre, the outer letters and the masks", () => {
    const puzzle = decodePuzzle("gadelnr");
    expect(puzzle.centre).toBe("g");
    expect(puzzle.outer).toEqual(["a", "d", "e", "l", "n", "r"]);
    expect(puzzle.letterMask).toBe(toLetterMask("adeglnr"));
    expect(puzzle.centreBit).toBe(6);
  });

  it("gives back what was encoded", () => {
    const mask = toLetterMask("bcfilty");
    const code = encodePuzzle(mask, "y".charCodeAt(0) - 97);
    const puzzle = decodePuzzle(code);
    expect(encodePuzzle(puzzle.letterMask, puzzle.centreBit)).toBe(code);
  });

  it("rejects a code that is not seven different lower-case letters", () => {
    ["", "abcdef", "abcdefgh", "aabcdef", "abcdefG", "abcde1f", "abcd efg"].forEach((code) => {
      expect(() => decodePuzzle(code)).toThrow();
    });
  });
});
