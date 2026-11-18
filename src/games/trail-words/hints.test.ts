import { describe, expect, it } from "vitest";
import { pickDailyTrailPuzzle } from "./daily";
import { buildHints } from "./hints";
import { buildTrailPuzzle } from "./puzzle";
import { readRealWordList } from "./testing";
import { toLetterMask } from "./words";

const { code, tier } = pickDailyTrailPuzzle(2);
const puzzle = buildTrailPuzzle(code, tier, readRealWordList());
const common = [...puzzle.common];

describe("buildHints", () => {
  const hints = buildHints(puzzle, new Set());

  it("counts the common words not yet found", () => {
    expect(hints.total).toBe(common.length);
  });

  it("counts words by first letter and length, in a grid", () => {
    hints.letters.forEach((letter, row) => {
      hints.lengths.forEach((length, column) => {
        const expected = common.filter(
          (word) => word[0] === letter && word.length === length,
        ).length;
        expect(hints.counts[row][column]).toBe(expected);
      });
    });
  });

  it("adds up the rows and the columns to the total", () => {
    expect(hints.rowTotals.reduce((a, b) => a + b, 0)).toBe(hints.total);
    expect(hints.columnTotals.reduce((a, b) => a + b, 0)).toBe(hints.total);
  });

  it("lists first letters alphabetically and lengths from shortest to longest", () => {
    expect([...hints.letters]).toEqual([...hints.letters].sort());
    expect([...hints.lengths]).toEqual([...hints.lengths].sort((a, b) => a - b));
  });

  it("only mentions letters and lengths that still have words", () => {
    hints.rowTotals.forEach((total) => expect(total).toBeGreaterThan(0));
    hints.columnTotals.forEach((total) => expect(total).toBeGreaterThan(0));
  });

  it("counts the pangrams left", () => {
    const expected = common.filter((word) => toLetterMask(word) === puzzle.letterMask).length;
    expect(hints.pangramsLeft).toBe(expected);
    expect(hints.pangramsLeft).toBeGreaterThanOrEqual(1);
  });

  it("never gives away a word, only counts", () => {
    expect(JSON.stringify(hints)).not.toContain(common[0]);
  });
});

describe("buildHints as words are found", () => {
  it("takes found words off the counts", () => {
    const found = new Set(common.slice(0, 3));
    expect(buildHints(puzzle, found).total).toBe(common.length - 3);
  });

  it("drops a row once all its words are found", () => {
    const letter = common[0][0];
    const found = new Set(common.filter((word) => word[0] === letter));
    expect(buildHints(puzzle, found).letters).not.toContain(letter);
  });

  it("ignores found words that are not common ones", () => {
    const extra = puzzle.words.find((word) => !puzzle.common.has(word));
    expect(buildHints(puzzle, new Set(extra ? [extra] : [])).total).toBe(common.length);
  });

  it("drops the pangram count when the pangram is found", () => {
    const pangram = common.find((word) => toLetterMask(word) === puzzle.letterMask) as string;
    const before = buildHints(puzzle, new Set()).pangramsLeft;
    expect(buildHints(puzzle, new Set([pangram])).pangramsLeft).toBe(before - 1);
  });

  it("is empty once everything is found", () => {
    const hints = buildHints(puzzle, new Set(common));
    expect(hints).toEqual({
      letters: [],
      lengths: [],
      counts: [],
      rowTotals: [],
      columnTotals: [],
      total: 0,
      pangramsLeft: 0,
    });
  });
});
