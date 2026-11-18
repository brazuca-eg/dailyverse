import { describe, expect, it } from "vitest";
import { countSolutions, findSolution, listSolutions } from "./solver";
import { TINY, easyRound, hardRound, mediumRound } from "./fixtures";
import type { SwitchbackPuzzle } from "./types";

const SERPENTINE = [0, 1, 2, 5, 4, 3, 6, 7, 8];
const UPRIGHT = [0, 3, 6, 7, 4, 1, 2, 5, 8];

describe("listSolutions", () => {
  it("finds every way through a 3x3 grid from corner to opposite corner", () => {
    const solutions = listSolutions(TINY, 10).map((path) => path.join());
    expect(solutions.sort()).toEqual([SERPENTINE.join(), UPRIGHT.join()].sort());
  });

  it("stops at the limit", () => {
    expect(listSolutions(TINY, 1)).toHaveLength(1);
    expect(countSolutions(TINY, 2)).toBe(2);
  });

  it("finds exactly one when a fence rules out the other way", () => {
    const fenced: SwitchbackPuzzle = { ...TINY, walls: [[3, 4]] };
    expect(listSolutions(fenced, 10)).toEqual([UPRIGHT]);
    expect(findSolution(fenced)).toEqual(UPRIGHT);
  });

  it("never crosses a fence", () => {
    const fenced: SwitchbackPuzzle = { ...TINY, walls: [[1, 2]] };
    expect(countSolutions(fenced, 5)).toBe(0);
  });

  it("finds one when a checkpoint forces the order", () => {
    const forced: SwitchbackPuzzle = { size: 3, marks: [0, 5, 8], walls: [] };
    const solutions = listSolutions(forced, 10);
    solutions.forEach((path) => {
      expect(path.indexOf(5)).toBeLessThan(path.indexOf(8));
    });
  });

  it("needs the checkpoints to be visited in order", () => {
    expect(countSolutions({ size: 3, marks: [0, 2, 1, 8], walls: [] }, 5)).toBe(0);
    expect(countSolutions({ size: 3, marks: [0, 1, 2, 8], walls: [] }, 5)).toBe(2);
  });

  it("only lets the last checkpoint be entered when every other square is covered", () => {
    expect(countSolutions({ size: 2, marks: [0, 3], walls: [] }, 5)).toBe(0);
    expect(listSolutions({ size: 2, marks: [0, 1], walls: [] }, 5)).toEqual([[0, 2, 3, 1]]);
    expect(listSolutions({ size: 2, marks: [0, 2], walls: [] }, 5)).toEqual([[0, 1, 3, 2]]);
  });

  it("finds nothing when the squares cannot all be reached", () => {
    const cut: SwitchbackPuzzle = {
      size: 3,
      marks: [0, 8],
      walls: [
        [1, 2],
        [5, 2],
      ],
    };
    expect(countSolutions(cut, 5)).toBe(0);
  });

  it("starts at the first checkpoint and covers every square once", () => {
    [easyRound, mediumRound, hardRound].forEach((round) => {
      const cells = round.puzzle.size * round.puzzle.size;
      expect(round.solution[0]).toBe(round.puzzle.marks[0]);
      expect(round.solution[round.solution.length - 1]).toBe(
        round.puzzle.marks[round.puzzle.marks.length - 1],
      );
      expect(new Set(round.solution).size).toBe(cells);
    });
  });

  it("finds exactly one solution for every real tier", () => {
    [easyRound, mediumRound, hardRound].forEach((round) => {
      expect(countSolutions(round.puzzle, 2)).toBe(1);
    });
  });

  it("does not change the puzzle it is given", () => {
    const puzzle: SwitchbackPuzzle = { size: 3, marks: [0, 8], walls: [[3, 4]] };
    const copy = structuredClone(puzzle);
    listSolutions(puzzle, 5);
    expect(puzzle).toEqual(copy);
  });
});

describe("findSolution", () => {
  it("returns null when there is none", () => {
    expect(findSolution({ size: 2, marks: [0, 3], walls: [] })).toBeNull();
  });
});
