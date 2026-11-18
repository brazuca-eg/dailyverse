import { describe, expect, it } from "vitest";
import { decodePuzzle } from "./codec";
import { listStartCells } from "./counts";
import { bearData } from "./data";
import { easyRound, hardRound, mediumRound } from "./fixtures";
import {
  LEVEL_ADVANCED,
  LEVEL_SINGLE,
  LEVEL_SUBSET,
  TECHNIQUES,
  findDeducedSafeCells,
  solveByLogic,
} from "./logic";
import { TIER_SETTINGS } from "./tiers";
import type { BearPuzzle } from "./types";

function listPool(tier: "easy" | "medium" | "hard", count: number): BearPuzzle[] {
  return bearData[tier]
    .slice(0, count)
    .map((stored) => decodePuzzle(TIER_SETTINGS[tier].size, stored));
}

describe("solveByLogic", () => {
  it("solves an easy puzzle with single-square rules alone", () => {
    const result = solveByLogic(easyRound.puzzle, LEVEL_SINGLE);
    expect(result).toEqual({ solved: true, hardest: LEVEL_SINGLE, mistakes: 0 });
  });

  it("needs the subset rule for a medium puzzle", () => {
    expect(solveByLogic(mediumRound.puzzle, LEVEL_SINGLE).solved).toBe(false);
    expect(solveByLogic(mediumRound.puzzle, LEVEL_SUBSET)).toEqual({
      solved: true,
      hardest: LEVEL_SUBSET,
      mistakes: 0,
    });
  });

  it("needs the advanced steps for a hard puzzle", () => {
    expect(solveByLogic(hardRound.puzzle, LEVEL_SUBSET).solved).toBe(false);
    expect(solveByLogic(hardRound.puzzle, LEVEL_ADVANCED)).toEqual({
      solved: true,
      hardest: LEVEL_ADVANCED,
      mistakes: 0,
    });
  });

  it("never makes a deduction that disagrees with where the bears are", () => {
    [...listPool("easy", 25), ...listPool("medium", 25), ...listPool("hard", 25)].forEach(
      (puzzle) => {
        expect(solveByLogic(puzzle).mistakes).toBe(0);
      },
    );
  });

  it("gives up without guessing, and reports a puzzle it cannot finish", () => {
    const stuck: BearPuzzle = { size: 4, bears: [5, 10], start: 0 };
    const result = solveByLogic(stuck);
    expect(result.mistakes).toBe(0);
    expect(typeof result.solved).toBe("boolean");
  });

  it("does not change the puzzle it is given", () => {
    const copy = structuredClone(mediumRound.puzzle);
    solveByLogic(mediumRound.puzzle);
    expect(mediumRound.puzzle).toEqual(copy);
  });
});

describe("each technique", () => {
  const cases: [string, "easy" | "medium" | "hard", number][] = [
    ["single", "easy", 0],
    ["subset", "medium", 0],
    ["lookahead", "hard", 0],
    ["global-count", "hard", 6],
  ];

  it.each(cases)("%s is needed by a real puzzle, and the solver uses it", (name, tier, index) => {
    const puzzle = listPool(tier, index + 1)[index];
    const without = TECHNIQUES.filter((technique) => technique.name !== name);
    const { maxLevel } = TIER_SETTINGS[tier];
    expect(solveByLogic(puzzle, maxLevel, without).solved).toBe(false);
    expect(solveByLogic(puzzle, maxLevel).solved).toBe(true);
  });

  it("are listed once each, from the easiest level to the hardest", () => {
    const names = TECHNIQUES.map((technique) => technique.name);
    expect(new Set(names).size).toBe(names.length);
    const levels = TECHNIQUES.map((technique) => technique.level);
    expect(levels).toEqual([...levels].sort((a, b) => a - b));
  });
});

describe("findDeducedSafeCells", () => {
  it("finds squares that are safe from what is already open", () => {
    const { puzzle } = easyRound;
    const opened = listStartCells(puzzle);
    const safe = findDeducedSafeCells(puzzle, opened, []);
    expect(safe.length).toBeGreaterThan(0);
    safe.forEach((cell) => {
      expect(puzzle.bears).not.toContain(cell);
      expect(opened).not.toContain(cell);
    });
  });

  it("keeps finding safe squares, one by one, until every safe square is open", () => {
    const { puzzle } = hardRound;
    const openAll = (opened: number[]): number[] => {
      const safe = findDeducedSafeCells(puzzle, opened, []);
      return safe.length === 0 ? opened : openAll([...opened, safe[0]]);
    };
    const finished = openAll(listStartCells(puzzle));
    const cells = puzzle.size * puzzle.size;
    expect(finished).toHaveLength(cells - puzzle.bears.length);
    puzzle.bears.forEach((bear) => expect(finished).not.toContain(bear));
  });

  it("uses bears that are already known", () => {
    const { puzzle } = easyRound;
    const opened = listStartCells(puzzle);
    const withKnown = findDeducedSafeCells(puzzle, opened, puzzle.bears);
    expect(withKnown.length).toBeGreaterThanOrEqual(
      findDeducedSafeCells(puzzle, opened, []).length,
    );
  });

  it("finds nothing once everything is open", () => {
    const { puzzle } = easyRound;
    const all = Array.from({ length: puzzle.size ** 2 }, (_, index) => index).filter(
      (index) => !puzzle.bears.includes(index),
    );
    expect(findDeducedSafeCells(puzzle, all, puzzle.bears)).toEqual([]);
  });
});
