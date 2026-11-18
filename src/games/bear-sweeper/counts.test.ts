import { describe, expect, it } from "vitest";
import { countAdjacentBears, floodReveal, listStartCells } from "./counts";
import { TINY, easyRound, hardRound, findBlankCell } from "./fixtures";
import type { BearPuzzle } from "./types";

describe("countAdjacentBears", () => {
  it("counts the bears in the eight squares around each square", () => {
    expect(countAdjacentBears(TINY)).toEqual([0, 0, 0, 0, 1, 1, 0, 1, 0]);
  });

  it("counts several bears", () => {
    const puzzle: BearPuzzle = { size: 3, bears: [0, 2, 8], start: 6 };
    expect(countAdjacentBears(puzzle)).toEqual([0, 2, 0, 1, 3, 2, 0, 1, 0]);
  });

  it("gives every square a count between 0 and 8", () => {
    [easyRound, hardRound].forEach((round) => {
      countAdjacentBears(round.puzzle).forEach((count) => {
        expect(count).toBeGreaterThanOrEqual(0);
        expect(count).toBeLessThanOrEqual(8);
      });
    });
  });
});

describe("floodReveal", () => {
  const counts = countAdjacentBears(TINY);

  it("opens a blank square and the squares around it, and stops at numbers", () => {
    const opened = floodReveal(TINY, counts, 0, () => false).sort((a, b) => a - b);
    expect(opened).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
  });

  it("opens only the square itself when it shows a number", () => {
    expect(floodReveal(TINY, counts, 4, () => false)).toEqual([4]);
  });

  it("never opens a bear, even when asked to start on one", () => {
    expect(floodReveal(TINY, counts, 8, () => false)).toEqual([]);
  });

  it("skips squares that are already open, and does not flood through them", () => {
    const opened = floodReveal(
      TINY,
      counts,
      0,
      (index) => index === 1 || index === 3 || index === 4,
    );
    expect(opened).toEqual([0]);
  });

  it("lists each square once", () => {
    const opened = floodReveal(
      hardRound.puzzle,
      countAdjacentBears(hardRound.puzzle),
      findBlankCell(hardRound.puzzle),
      () => false,
    );
    expect(new Set(opened).size).toBe(opened.length);
  });
});

describe("listStartCells", () => {
  it("opens the clearing around the start", () => {
    expect(listStartCells(TINY).sort((a, b) => a - b)).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
  });

  it("includes the start square, and never a bear", () => {
    [easyRound, hardRound].forEach((round) => {
      const cells = listStartCells(round.puzzle);
      expect(cells).toContain(round.puzzle.start);
      cells.forEach((cell) => expect(round.puzzle.bears).not.toContain(cell));
    });
  });

  it("starts from a blank square, so the clearing is more than one square", () => {
    [easyRound, hardRound].forEach((round) => {
      expect(countAdjacentBears(round.puzzle)[round.puzzle.start]).toBe(0);
      expect(listStartCells(round.puzzle).length).toBeGreaterThan(1);
    });
  });
});
