import { describe, expect, it } from "vitest";
import { pickDailyTrailPuzzle } from "./daily";
import {
  calculateScore,
  createInitialState,
  deleteLastLetter,
  describeAcceptance,
  describeRejection,
  endGame,
  evaluateGuess,
  listMissedWords,
  MAX_INPUT_LENGTH,
  readStatus,
  submitGuess,
  typeLetter,
} from "./game";
import { buildTrailPuzzle } from "./puzzle";
import { readRealWordList } from "./testing";
import { scoreWord } from "./analysis";

const { code, tier } = pickDailyTrailPuzzle(2);
const puzzle = buildTrailPuzzle(code, tier, readRealWordList());
const fresh = createInitialState(code);
const pangram = puzzle.pangrams[0];
const plain = puzzle.words.find(
  (word) => !puzzle.pangrams.includes(word) && word.length === 4,
) as string;
const outside = "abcdefghijklmnopqrstuvwxyz"
  .split("")
  .find((letter) => !code.includes(letter)) as string;
const withoutCentre = puzzle.outer.join("");
const unlisted = puzzle.centre.repeat(4);

function scoreAll(words: readonly string[]) {
  return words.reduce((total, word) => total + scoreWord(word, puzzle.letterMask), 0);
}

describe("evaluateGuess", () => {
  it("accepts a listed word, with its points", () => {
    expect(evaluateGuess(puzzle, [], plain)).toEqual({
      accepted: true,
      word: plain,
      points: 1,
      isPangram: false,
    });
  });

  it("recognises a pangram, which scores its length plus 7", () => {
    expect(evaluateGuess(puzzle, [], pangram)).toEqual({
      accepted: true,
      word: pangram,
      points: pangram.length + 7,
      isPangram: true,
    });
  });

  it("ignores letter case", () => {
    expect(evaluateGuess(puzzle, [], plain.toUpperCase())).toMatchObject({
      accepted: true,
      word: plain,
    });
  });

  it("rejects a short word, even an empty one", () => {
    expect(evaluateGuess(puzzle, [], plain.slice(0, 3))).toEqual({
      accepted: false,
      reason: "too-short",
    });
    expect(evaluateGuess(puzzle, [], "")).toEqual({ accepted: false, reason: "too-short" });
  });

  it("rejects a letter outside the seven before checking the centre", () => {
    expect(evaluateGuess(puzzle, [], plain.slice(0, 3) + outside)).toEqual({
      accepted: false,
      reason: "bad-letters",
    });
  });

  it("rejects a word without the centre letter", () => {
    expect(evaluateGuess(puzzle, [], withoutCentre.slice(0, 4))).toEqual({
      accepted: false,
      reason: "missing-centre",
    });
  });

  it("rejects a word that was already found", () => {
    expect(evaluateGuess(puzzle, [plain], plain)).toEqual({
      accepted: false,
      reason: "already-found",
    });
  });

  it("rejects letters that fit but are not a word", () => {
    expect(evaluateGuess(puzzle, [], unlisted)).toEqual({ accepted: false, reason: "not-in-list" });
  });

  it("accepts every listed word", () => {
    puzzle.words.forEach((word) => expect(evaluateGuess(puzzle, [], word).accepted).toBe(true));
  });
});

describe("submitGuess", () => {
  it("adds an accepted word in order", () => {
    const first = submitGuess(puzzle, fresh, plain);
    const second = submitGuess(puzzle, first.state, pangram);
    expect(second.state.found).toEqual([plain, pangram]);
    expect(fresh.found).toEqual([]);
  });

  it("leaves the state alone when the word is rejected", () => {
    const outcome = submitGuess(puzzle, fresh, "zzzz");
    expect(outcome.state).toBe(fresh);
    expect(outcome.result.accepted).toBe(false);
  });

  it("refuses words after the game has ended", () => {
    expect(() => submitGuess(puzzle, endGame(fresh), plain)).toThrow();
  });
});

describe("score and status", () => {
  it("adds up the points of the found words", () => {
    expect(calculateScore(puzzle, [])).toBe(0);
    expect(calculateScore(puzzle, [plain, pangram])).toBe(scoreAll([plain, pangram]));
  });

  it("is playing at first, and lost if ended before Ranger", () => {
    expect(readStatus(puzzle, fresh)).toBe("playing");
    expect(readStatus(puzzle, endGame(fresh))).toBe("lost");
  });

  it("is won exactly when half of the common points are reached, and stays won after ending", () => {
    const common = [...puzzle.common];
    const needed = Math.ceil(puzzle.maxScore * 0.5);
    let found: string[] = [];
    let total = 0;
    common.forEach((word) => {
      if (total < needed) {
        found = [...found, word];
        total += scoreWord(word, puzzle.letterMask);
      }
    });
    const almost = found.slice(0, -1);
    expect(readStatus(puzzle, { ...fresh, found: almost })).toBe("playing");
    expect(readStatus(puzzle, { ...fresh, found })).toBe("won");
    expect(readStatus(puzzle, { puzzleId: code, found, ended: true })).toBe("won");
  });
});

describe("typing", () => {
  it("adds lower-case letters and ignores everything else", () => {
    expect(typeLetter("ab", "C")).toBe("abc");
    expect(typeLetter("ab", "1")).toBe("ab");
    expect(typeLetter("ab", "Enter")).toBe("ab");
    expect(typeLetter("ab", " ")).toBe("ab");
    expect(typeLetter("ab", "é")).toBe("ab");
  });

  it("stops at the longest allowed word", () => {
    const full = "a".repeat(MAX_INPUT_LENGTH);
    expect(typeLetter(full, "b")).toBe(full);
    expect(typeLetter(full.slice(1), "b")).toBe(full.slice(1) + "b");
  });

  it("deletes the last letter, and nothing from an empty input", () => {
    expect(deleteLastLetter("abc")).toBe("ab");
    expect(deleteLastLetter("")).toBe("");
  });
});

describe("listMissedWords", () => {
  it("lists every word not yet found, in order", () => {
    const missed = listMissedWords(puzzle, [plain, pangram]);
    expect(missed).toHaveLength(puzzle.words.length - 2);
    expect(missed).not.toContain(plain);
    expect([...missed]).toEqual([...missed].sort());
  });

  it("is empty when everything is found", () => {
    expect(listMissedWords(puzzle, puzzle.words)).toEqual([]);
  });
});

describe("messages", () => {
  it("has a different message for every reason", () => {
    const reasons = [
      "too-short",
      "bad-letters",
      "missing-centre",
      "already-found",
      "not-in-list",
    ] as const;
    const messages = reasons.map(describeRejection);
    expect(new Set(messages).size).toBe(5);
    expect(describeRejection("too-short")).toBe("Too short");
    expect(describeRejection("missing-centre")).toBe("Missing centre letter");
  });

  it("shows points, and celebrates a pangram", () => {
    expect(describeAcceptance({ points: 3, isPangram: false })).toBe("+3");
    expect(describeAcceptance({ points: 14, isPangram: true })).toBe("Pangram! +14");
  });
});
