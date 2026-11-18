import { describe, expect, it } from "vitest";
import { encodePuzzle } from "../../src/games/trail-words/encode";
import { parseWordList, toLetterMask } from "../../src/games/trail-words/words";
import { buildTrailData, NOTICE_LINES } from "./build";

const LETTERS = ["a", "b", "c", "d", "e", "f", "t"];
const centreBit = 0;

function makeWords(): string[] {
  const fours = LETTERS.slice(1).map(
    (letter, index) => `a${letter}${LETTERS[(index + 2) % 7]}${LETTERS[(index + 3) % 7]}`,
  );
  const longer = LETTERS.slice(1).flatMap((first) =>
    LETTERS.slice(1).map((second) => `a${first}${second}${first}${second}b`),
  );
  return [...new Set([...fours, ...longer.slice(0, 36), "abcdeft"])];
}

function scowl(words: readonly string[]): string {
  return `Header\nCopyright\n---\n${words.join("\n")}\n`;
}

const words = makeWords();
const base = {
  enableText: `${words.join("\n")}\nabcdefta\n`,
  commonText: scowl(words),
  acceptedText: scowl(words),
  blocklistText: "",
};

describe("buildTrailData", () => {
  it("makes a word file with the notice, the common words marked and the words sorted", () => {
    const data = buildTrailData(base);
    expect(data.wordFile.startsWith(`# ${NOTICE_LINES[0]}`)).toBe(true);
    const list = parseWordList(data.wordFile);
    expect(list.words).toEqual([...words].sort());
    expect(list.common.size).toBe(words.length);
  });

  it("puts the centre that fits the medium rules in the medium pool, and not in hard", () => {
    const data = buildTrailData(base);
    const wanted = encodePuzzle(toLetterMask("abcdeft"), centreBit);
    expect(data.puzzles.medium).toContain(wanted);
    expect(data.puzzles.hard).not.toContain(wanted);
  });

  it("only makes puzzles from the letters that have a pangram", () => {
    const data = buildTrailData(base);
    [...data.puzzles.medium, ...data.puzzles.hard].forEach((code) => {
      expect(toLetterMask(code)).toBe(toLetterMask("abcdeft"));
    });
  });

  it("never puts the same puzzle in both pools", () => {
    const data = buildTrailData(base);
    const overlap = data.puzzles.medium.filter((code) => data.puzzles.hard.includes(code));
    expect(overlap).toEqual([]);
  });

  it("counts the words and the candidates", () => {
    const data = buildTrailData(base);
    expect(data.wordCount).toBe(words.length);
    expect(data.commonCount).toBe(words.length);
    expect(data.candidateCounts.medium).toBeGreaterThanOrEqual(1);
    expect(data.puzzles.medium.length).toBeLessThanOrEqual(data.candidateCounts.medium);
    expect(data.puzzles.hard.length).toBeLessThanOrEqual(data.candidateCounts.hard);
  });

  it("drops words that are not in ENABLE", () => {
    const data = buildTrailData({
      ...base,
      enableText: words.filter((word) => word !== "abcdeft").join("\n"),
    });
    expect(parseWordList(data.wordFile).accepted.has("abcdeft")).toBe(false);
    expect(data.puzzles.medium).toEqual([]);
  });

  it("drops blocked words", () => {
    const blocked = words[0];
    const data = buildTrailData({ ...base, blocklistText: `${blocked}\n` });
    expect(parseWordList(data.wordFile).accepted.has(blocked)).toBe(false);
  });

  it("accepts words that are not common but does not count them toward a puzzle", () => {
    const data = buildTrailData({ ...base, commonText: scowl(words.slice(0, 5)) });
    const list = parseWordList(data.wordFile);
    expect(list.accepted.size).toBe(words.length);
    expect(list.common.size).toBe(5);
    expect(data.puzzles.medium).toEqual([]);
  });

  it("needs a common pangram", () => {
    const data = buildTrailData({
      ...base,
      commonText: scowl(words.filter((word) => word !== "abcdeft")),
    });
    expect(data.puzzles.medium).toEqual([]);
  });

  it("is the same every time", () => {
    expect(buildTrailData(base)).toEqual(buildTrailData(base));
  });

  it("copes with no words at all", () => {
    const data = buildTrailData({
      enableText: "",
      commonText: "",
      acceptedText: "",
      blocklistText: "",
    });
    expect(data.puzzles).toEqual({ medium: [], hard: [] });
    expect(data.wordCount).toBe(0);
  });
});
