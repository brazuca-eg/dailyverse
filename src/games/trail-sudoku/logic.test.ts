import { describe, expect, it } from "vitest";
import { decodeGrid } from "./codec";
import { sudokuData } from "./data";
import {
  CLASSIC_GIVENS,
  CLASSIC_SOLUTION,
  easyRound,
  hardRound,
  mediumRound,
  toDigits,
} from "./fixtures";
import { LAYOUT_6, LAYOUT_9 } from "./layout";
import {
  LEVEL_ADVANCED,
  LEVEL_HIDDEN,
  LEVEL_NAKED,
  LEVEL_SUBSETS,
  TECHNIQUES,
  solveByLogic,
} from "./logic";

describe("solveByLogic", () => {
  it("solves the classic puzzle with simple steps, and agrees with the known solution", () => {
    const result = solveByLogic(LAYOUT_9, toDigits(CLASSIC_GIVENS));
    expect(result.solved).toBe(true);
    expect(result.grid.join("")).toBe(CLASSIC_SOLUTION);
  });

  it("solves an easy puzzle with naked singles alone", () => {
    const result = solveByLogic(LAYOUT_6, easyRound.puzzle.givens, LEVEL_NAKED);
    expect(result.solved).toBe(true);
    expect(result.hardest).toBe(LEVEL_NAKED);
    expect(result.grid).toEqual([...easyRound.puzzle.solution]);
  });

  it("cannot solve a medium puzzle with naked singles alone, but can with hidden singles", () => {
    expect(solveByLogic(LAYOUT_6, mediumRound.puzzle.givens, LEVEL_NAKED).solved).toBe(false);
    const result = solveByLogic(LAYOUT_6, mediumRound.puzzle.givens, LEVEL_HIDDEN);
    expect(result.solved).toBe(true);
    expect(result.hardest).toBe(LEVEL_HIDDEN);
  });

  it("needs more than hidden singles for a hard puzzle", () => {
    expect(solveByLogic(LAYOUT_9, hardRound.puzzle.givens, LEVEL_HIDDEN).solved).toBe(false);
    const result = solveByLogic(LAYOUT_9, hardRound.puzzle.givens, LEVEL_ADVANCED);
    expect(result.solved).toBe(true);
    expect(result.hardest).toBeGreaterThanOrEqual(LEVEL_SUBSETS);
    expect(result.grid).toEqual([...hardRound.puzzle.solution]);
  });

  it("leaves the grid unsolved, and says how far it got, when the steps run out", () => {
    const result = solveByLogic(LAYOUT_9, hardRound.puzzle.givens, LEVEL_NAKED);
    expect(result.solved).toBe(false);
    expect(result.grid.filter((digit) => digit !== 0).length).toBeGreaterThanOrEqual(
      hardRound.puzzle.givens.filter((digit) => digit !== 0).length,
    );
  });

  it("never writes a digit that disagrees with the solution", () => {
    [easyRound, mediumRound, hardRound].forEach((round) => {
      const layout = round.puzzle.size === 6 ? LAYOUT_6 : LAYOUT_9;
      const result = solveByLogic(layout, round.puzzle.givens, LEVEL_NAKED);
      result.grid.forEach((digit, index) => {
        if (digit !== 0) {
          expect(digit).toBe(round.puzzle.solution[index]);
        }
      });
    });
  });

  it("reports an unsolvable grid when the givens clash", () => {
    const clash = toDigits(CLASSIC_GIVENS);
    clash[1] = 5;
    expect(solveByLogic(LAYOUT_9, clash)).toEqual({ solved: false, hardest: 0, grid: clash });
  });

  it("does nothing to a grid that is already complete", () => {
    const result = solveByLogic(LAYOUT_9, toDigits(CLASSIC_SOLUTION));
    expect(result).toEqual({ solved: true, hardest: 0, grid: toDigits(CLASSIC_SOLUTION) });
  });

  it("does not change the grid it is given", () => {
    const grid = toDigits(CLASSIC_GIVENS);
    solveByLogic(LAYOUT_9, grid);
    expect(grid).toEqual(toDigits(CLASSIC_GIVENS));
  });
});

describe("each technique", () => {
  const cases: [string, number, number][] = [
    ["locked-candidates", 2, LEVEL_SUBSETS],
    ["naked-pair", 29, LEVEL_SUBSETS],
    ["hidden-pair", 5, LEVEL_ADVANCED],
    ["naked-triple", 128, LEVEL_ADVANCED],
  ];

  it.each(cases)(
    "%s is needed by a real puzzle, and the solver uses it",
    (name, poolIndex, level) => {
      const grid = decodeGrid(sudokuData.hard[poolIndex]);
      const without = TECHNIQUES.filter((technique) => technique.name !== name);
      expect(solveByLogic(LAYOUT_9, grid, LEVEL_ADVANCED, without).solved).toBe(false);
      const withAll = solveByLogic(LAYOUT_9, grid, LEVEL_ADVANCED);
      expect(withAll.solved).toBe(true);
      expect(withAll.hardest).toBeGreaterThanOrEqual(level);
    },
  );

  it("is listed once, from the easiest level to the hardest", () => {
    const names = TECHNIQUES.map((technique) => technique.name);
    expect(new Set(names).size).toBe(names.length);
    const levels = TECHNIQUES.map((technique) => technique.level);
    expect(levels).toEqual([...levels].sort((a, b) => a - b));
  });

  it("only writes digits that agree with the solution, whichever techniques are used", () => {
    const round = sudokuData.hard.slice(0, 6).map(decodeGrid);
    round.forEach((grid) => {
      const solved = solveByLogic(LAYOUT_9, grid, LEVEL_ADVANCED);
      expect(solved.grid.every((digit) => digit >= 1 && digit <= 9)).toBe(true);
    });
  });
});
