import { describe, expect, it } from "vitest";
import { indexWords, listWordsForLetters, measurePuzzle, scoreWord } from "./analysis";
import { pickDailyTrailPuzzle } from "./daily";
import { buildTrailPuzzle, listPuzzleWords } from "./puzzle";
import { readRealWordList } from "./testing";
import { fitsTier, TIER_RULES } from "./tiers";
import { toLetterMask } from "./words";

const list = readRealWordList();
const DAYS = Array.from({ length: 120 }, (_, day) => day);

function puzzleFor(day: number) {
  const { code, tier } = pickDailyTrailPuzzle(day);
  return buildTrailPuzzle(code, tier, list);
}

describe("buildTrailPuzzle", () => {
  it("knows its letters, centre and tier", () => {
    const { code, tier } = pickDailyTrailPuzzle(3);
    const puzzle = buildTrailPuzzle(code, tier, list);
    expect(puzzle.code).toBe(code);
    expect(puzzle.tier).toBe(tier);
    expect(puzzle.centre).toBe(code[0]);
    expect(puzzle.outer.join("")).toBe(code.slice(1));
    expect(puzzle.letterMask).toBe(toLetterMask(code));
  });

  it("lists only words that use the centre letter and no letter outside the seven", () => {
    DAYS.slice(0, 40).forEach((day) => {
      const puzzle = puzzleFor(day);
      puzzle.words.forEach((word) => {
        expect(word.length).toBeGreaterThanOrEqual(4);
        expect(word).toContain(puzzle.centre);
        expect([...word].every((letter) => puzzle.code.includes(letter))).toBe(true);
      });
    });
  });

  it("lists the words in order, each once", () => {
    const puzzle = puzzleFor(0);
    expect([...puzzle.words]).toEqual([...puzzle.words].sort());
    expect(new Set(puzzle.words).size).toBe(puzzle.words.length);
  });

  it("has a pangram that uses all seven letters, and it is one of the words", () => {
    DAYS.forEach((day) => {
      const puzzle = puzzleFor(day);
      expect(puzzle.pangrams.length).toBeGreaterThanOrEqual(1);
      puzzle.pangrams.forEach((word) => {
        expect(new Set(word).size).toBe(7);
        expect(puzzle.words).toContain(word);
      });
    });
  });

  it("has a common pangram, so the day can always be finished", () => {
    DAYS.forEach((day) => {
      const puzzle = puzzleFor(day);
      expect(puzzle.pangrams.some((word) => puzzle.common.has(word))).toBe(true);
    });
  });

  it("counts the common words and their score, with the pangram bonus", () => {
    const puzzle = puzzleFor(5);
    const expected = [...puzzle.common].reduce(
      (total, word) => total + scoreWord(word, puzzle.letterMask),
      0,
    );
    expect(puzzle.maxScore).toBe(expected);
    [...puzzle.common].forEach((word) => expect(puzzle.words).toContain(word));
  });

  it("fits its tier's rules for every day", () => {
    DAYS.forEach((day) => {
      const puzzle = puzzleFor(day);
      const metrics = measurePuzzle(puzzle.words, puzzle.letterMask, puzzle.centreBit, list.common);
      expect(fitsTier(metrics, puzzle.tier)).toBe(true);
    });
  });

  it("is hard enough: medium days have 30 to 50 words and hard days 15 to 29", () => {
    DAYS.forEach((day) => {
      const puzzle = puzzleFor(day);
      const rules = TIER_RULES[puzzle.tier];
      expect(puzzle.common.size).toBeGreaterThanOrEqual(rules.minWords);
      expect(puzzle.common.size).toBeLessThanOrEqual(rules.maxWords);
    });
  });

  it("finds the same words as the slower build-time method", () => {
    const index = indexWords(list.words);
    DAYS.slice(0, 30).forEach((day) => {
      const puzzle = puzzleFor(day);
      const slow = listWordsForLetters(index, puzzle.letterMask).filter((word) =>
        word.includes(puzzle.centre),
      );
      expect([...puzzle.words]).toEqual([...slow].sort());
    });
  });

  it("contains no word that was blocked or is an abbreviation", () => {
    const bad = new Set(["pimp", "prick", "moron", "acct", "dept", "atty"]);
    DAYS.forEach((day) =>
      puzzleFor(day).words.forEach((word) => expect(bad.has(word)).toBe(false)),
    );
  });

  it("is quick to build, because it runs in the browser", () => {
    const started = performance.now();
    DAYS.slice(0, 20).forEach((day) => puzzleFor(day));
    expect((performance.now() - started) / 20).toBeLessThan(40);
  });

  it("gives the same puzzle every time", () => {
    expect(puzzleFor(9)).toEqual(puzzleFor(9));
  });
});

describe("listPuzzleWords", () => {
  const letters = toLetterMask("adeglnr");
  const centreBit = "g".charCodeAt(0) - 97;

  it("keeps words that fit the letters and use the centre", () => {
    expect(listPuzzleWords(["angel", "dread", "tree", "aged", "cat"], letters, centreBit)).toEqual([
      "angel",
      "aged",
    ]);
  });

  it("gives nothing for no words", () => {
    expect(listPuzzleWords([], letters, centreBit)).toEqual([]);
  });
});
