import { describe, expect, it } from "vitest";
import { DIFFICULTIES, WEEKLY_DIFFICULTY_PATTERN } from "../../core/difficulty";
import { sudokuData, type SudokuData } from "./data";
import {
  buildDailySudokuRound,
  buildSudokuRound,
  findDailySudokuRound,
  pickDailySudoku,
} from "./daily";
import { countSolutions } from "./solver";
import { TIER_SETTINGS } from "./tiers";

const DAYS = Array.from({ length: 730 }, (_, day) => day);

describe("pickDailySudoku", () => {
  it("follows the weekly pattern for the tier", () => {
    DAYS.slice(0, 28).forEach((day) => {
      expect(pickDailySudoku(day).tier).toBe(WEEKLY_DIFFICULTY_PATTERN[day % 7]);
    });
  });

  it("picks a puzzle that exists in the pool of its tier", () => {
    DAYS.forEach((day) => {
      const { tier, poolIndex } = pickDailySudoku(day);
      expect(sudokuData[tier][poolIndex]).toBeDefined();
    });
  });

  it("gives the same puzzle every time for the same day", () => {
    DAYS.slice(0, 50).forEach((day) => expect(pickDailySudoku(day)).toEqual(pickDailySudoku(day)));
  });

  it("never repeats a puzzle in the first two years", () => {
    const keys = DAYS.map((day) => {
      const { tier, poolIndex } = pickDailySudoku(day);
      return `${tier}:${poolIndex}`;
    });
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("uses each puzzle of a pool once before any comes round again", () => {
    DIFFICULTIES.forEach((tier) => {
      const size = sudokuData[tier].length;
      const seen = Array.from({ length: 3000 }, (_, day) => pickDailySudoku(day))
        .filter((pick) => pick.tier === tier)
        .slice(0, size)
        .map((pick) => pick.poolIndex);
      expect(seen).toHaveLength(size);
      expect(new Set(seen).size).toBe(size);
    });
  });

  it("does not hand out a pool in its stored order", () => {
    const first = DAYS.map((day) => pickDailySudoku(day))
      .filter((pick) => pick.tier === "easy")
      .slice(0, 10)
      .map((pick) => pick.poolIndex);
    expect(first).not.toEqual(Array.from({ length: 10 }, (_, index) => index));
  });

  it("works for days before the launch and far in the future", () => {
    [-1, -7, -8, -100, 7 * 5000].forEach((day) => {
      const { tier, poolIndex } = pickDailySudoku(day);
      expect(sudokuData[tier][poolIndex]).toBeDefined();
    });
    expect(pickDailySudoku(-1).tier).toBe(WEEKLY_DIFFICULTY_PATTERN[6]);
  });

  it("uses the size of the data it is given", () => {
    const small: SudokuData = { easy: ["0"], medium: ["0", "0"], hard: ["0", "0", "0"] };
    DAYS.slice(0, 100).forEach((day) => {
      const { tier, poolIndex } = pickDailySudoku(day, small);
      expect(poolIndex).toBeLessThan(small[tier].length);
    });
  });
});

describe("buildSudokuRound", () => {
  it("decodes the givens and solves them", () => {
    DIFFICULTIES.forEach((tier) => {
      const round = buildSudokuRound(tier, 3);
      const { layout } = TIER_SETTINGS[tier];
      expect(round.tier).toBe(tier);
      expect(round.seed).toBe(3);
      expect(round.puzzle.size).toBe(layout.size);
      expect(countSolutions(layout, round.puzzle.givens, 2)).toBe(1);
      round.puzzle.givens.forEach((given, index) => {
        if (given !== 0) {
          expect(round.puzzle.solution[index]).toBe(given);
        }
      });
    });
  });

  it("refuses a puzzle that is not in the pool", () => {
    expect(() => buildSudokuRound("easy", 9999)).toThrow("no easy Trail Sudoku number 9999");
    expect(() => buildSudokuRound("easy", -1)).toThrow();
  });

  it("refuses a puzzle that cannot be solved", () => {
    const broken: SudokuData = { ...sudokuData, easy: ["11" + "0".repeat(34)] };
    expect(() => buildSudokuRound("easy", 0, broken)).toThrow("has no solution");
  });
});

describe("buildDailySudokuRound and findDailySudokuRound", () => {
  it("build the puzzle that the daily pick names", () => {
    DAYS.slice(0, 20).forEach((day) => {
      const { tier, poolIndex } = pickDailySudoku(day);
      const round = buildDailySudokuRound(day);
      expect([round.tier, round.seed]).toEqual([tier, poolIndex]);
      expect(findDailySudokuRound(day)).toEqual(round);
    });
  });

  it("find nothing, instead of failing, when the data is broken", () => {
    const broken: SudokuData = { easy: ["x"], medium: ["x"], hard: ["x"] };
    expect(findDailySudokuRound(0, broken)).toBeNull();
  });

  it("is quick, because it runs in the browser", () => {
    const started = performance.now();
    DAYS.slice(0, 30).forEach((day) => buildDailySudokuRound(day));
    expect((performance.now() - started) / 30).toBeLessThan(50);
  });
});
