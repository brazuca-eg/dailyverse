import { describe, expect, it } from "vitest";
import { createRandom } from "../../core/random";
import { CLASSIC_GIVENS, CLASSIC_SOLUTION, easyRound, toDigits } from "./fixtures";
import { LAYOUT_6, LAYOUT_9, listDigits } from "./layout";
import { computeCandidates, countSolutions, readPeers, solveGrid } from "./solver";

const classic = toDigits(CLASSIC_GIVENS);
const empty6 = Array.from({ length: 36 }, () => 0);

describe("computeCandidates", () => {
  it("removes the digits of the peers", () => {
    const masks = computeCandidates(LAYOUT_9, classic) as number[];
    expect(listDigits(masks[2])).toEqual([1, 2, 4]);
  });

  it("gives a filled cell only its own digit", () => {
    expect((computeCandidates(LAYOUT_9, classic) as number[])[0]).toBe(1 << 4);
  });

  it("returns null when two peers hold the same digit", () => {
    const clash = [...classic];
    clash[1] = 5;
    expect(computeCandidates(LAYOUT_9, clash)).toBeNull();
  });

  it("returns null when a cell has no digit left", () => {
    const stuck = [...empty6];
    [1, 2, 3, 4, 5].forEach((digit, col) => {
      stuck[col + 1] = digit;
    });
    stuck[6] = 6;
    expect(computeCandidates(LAYOUT_6, stuck)).toBeNull();
  });
});

describe("readPeers", () => {
  it("gives the same list every time", () => {
    expect(readPeers(LAYOUT_9)).toBe(readPeers(LAYOUT_9));
    expect(readPeers(LAYOUT_6)).not.toBe(readPeers(LAYOUT_9));
  });
});

describe("countSolutions", () => {
  it("finds exactly one solution for a proper puzzle", () => {
    expect(countSolutions(LAYOUT_9, classic)).toBe(1);
    expect(countSolutions(LAYOUT_6, easyRound.puzzle.givens)).toBe(1);
  });

  it("stops counting at the limit", () => {
    expect(countSolutions(LAYOUT_6, empty6, 2)).toBe(2);
    expect(countSolutions(LAYOUT_6, empty6, 5)).toBe(5);
  });

  it("finds more than one when a clue is missing that matters", () => {
    const loose = [...classic];
    [0, 1, 3, 4].forEach((index) => {
      loose[index] = 0;
    });
    expect(countSolutions(LAYOUT_9, loose, 3)).toBeGreaterThan(1);
  });

  it("finds none for a puzzle that cannot be finished", () => {
    const clash = [...classic];
    clash[1] = 5;
    expect(countSolutions(LAYOUT_9, clash)).toBe(0);
    const dead = [...classic];
    dead[2] = 5;
    expect(countSolutions(LAYOUT_9, dead)).toBe(0);
  });

  it("does not change the grid it is given", () => {
    const copy = [...classic];
    countSolutions(LAYOUT_9, copy);
    expect(copy).toEqual(classic);
  });
});

describe("solveGrid", () => {
  it("solves the classic puzzle", () => {
    expect(solveGrid(LAYOUT_9, classic)?.join("")).toBe(CLASSIC_SOLUTION);
  });

  it("keeps the given digits", () => {
    const solved = solveGrid(LAYOUT_6, easyRound.puzzle.givens) as number[];
    easyRound.puzzle.givens.forEach((given, index) => {
      if (given !== 0) {
        expect(solved[index]).toBe(given);
      }
    });
  });

  it("returns null when there is no solution", () => {
    const clash = [...classic];
    clash[1] = 5;
    expect(solveGrid(LAYOUT_9, clash)).toBeNull();
  });

  it("builds a valid full grid from nothing, differently for different seeds", () => {
    const first = solveGrid(LAYOUT_6, empty6, createRandom(1)) as number[];
    const second = solveGrid(LAYOUT_6, empty6, createRandom(2)) as number[];
    [first, second].forEach((grid) => {
      expect(grid.every((digit) => digit >= 1 && digit <= 6)).toBe(true);
      expect(computeCandidates(LAYOUT_6, grid)).not.toBeNull();
    });
    expect(first).not.toEqual(second);
    expect(solveGrid(LAYOUT_6, empty6, createRandom(1))).toEqual(first);
  });

  it("builds a valid full 9x9 grid", () => {
    const grid = solveGrid(
      LAYOUT_9,
      Array.from({ length: 81 }, () => 0),
      createRandom(5),
    ) as number[];
    expect(grid).toHaveLength(81);
    expect(countSolutions(LAYOUT_9, grid)).toBe(1);
  });
});
