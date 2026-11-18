import { describe, expect, it } from "vitest";
import { sudokuData, type SudokuData } from "./data";
import { TIER_SETTINGS } from "./tiers";
import { verifySudokuData } from "./verify";

function trimmed(): SudokuData {
  return structuredClone({
    easy: sudokuData.easy.slice(0, 4),
    medium: sudokuData.medium.slice(0, 4),
    hard: sudokuData.hard.slice(0, 3),
  });
}

function issuesOtherThanSize(data: SudokuData): string[] {
  return verifySudokuData(data).filter((issue) => !/only \d+ puzzles/.test(issue));
}

describe("the real Trail Sudoku data", () => {
  it("has enough puzzles in each pool for two years", () => {
    (["easy", "medium", "hard"] as const).forEach((tier) => {
      expect(sudokuData[tier].length).toBeGreaterThanOrEqual(TIER_SETTINGS[tier].poolSize);
    });
  });

  it("holds only 6x6 grids for easy and medium and 9x9 grids for hard", () => {
    sudokuData.easy.forEach((text) => expect(text).toHaveLength(36));
    sudokuData.medium.forEach((text) => expect(text).toHaveLength(36));
    sudokuData.hard.forEach((text) => expect(text).toHaveLength(81));
  });

  it("passes the verifier, apart from pool size, on a sample", () => {
    expect(issuesOtherThanSize(trimmed())).toEqual([]);
  });

  it("has no duplicate puzzles in any pool", () => {
    (["easy", "medium", "hard"] as const).forEach((tier) => {
      expect(new Set(sudokuData[tier]).size).toBe(sudokuData[tier].length);
    });
  });
});

describe("verifySudokuData finds", () => {
  it("too few puzzles", () => {
    const text = verifySudokuData(trimmed()).join("\n");
    expect(text).toContain(`easy: only 4 puzzles, need ${TIER_SETTINGS.easy.poolSize}`);
  });

  it("a duplicate puzzle", () => {
    const data = trimmed();
    data.easy[1] = data.easy[0];
    expect(issuesOtherThanSize(data).join("\n")).toContain("easy #1: duplicate puzzle");
  });

  it("a grid of the wrong size or with text in it", () => {
    const data = trimmed();
    data.easy[0] = "123";
    data.medium[0] = "x".repeat(36);
    const text = issuesOtherThanSize(data).join("\n");
    expect(text).toContain("easy #0: not a 6x6 grid");
    expect(text).toContain("medium #0: not a 6x6 grid");
  });

  it("a digit that is too big for the grid", () => {
    const data = trimmed();
    data.easy[0] = `7${data.easy[0].slice(1)}`;
    expect(issuesOtherThanSize(data).join("\n")).toContain("easy #0: not a 6x6 grid");
  });

  it("a puzzle with fewer clues than the tier allows", () => {
    const data = trimmed();
    data.easy[0] = data.medium[0];
    const text = issuesOtherThanSize(data).join("\n");
    expect(text).toContain(`easy #0: fewer than ${TIER_SETTINGS.easy.minClues} clues`);
  });

  it("a puzzle with more than one solution", () => {
    const data = trimmed();
    data.medium[0] = `0000${data.medium[0].slice(4)}`;
    expect(issuesOtherThanSize(data).join("\n")).toContain(
      "medium #0: does not have exactly one solution",
    );
  });

  it("a puzzle that does not fit its tier's rules", () => {
    const data = trimmed();
    data.hard[0] = trimmed().hard[1];
    data.medium[0] = trimmed().easy[0];
    const text = issuesOtherThanSize(data).join("\n");
    expect(text).toContain("medium #0: does not fit the medium rules");
  });
});
