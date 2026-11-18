import { describe, expect, it } from "vitest";
import {
  countLetters,
  formatWordList,
  isAnswerable,
  LETTER_COUNT,
  MIN_WORD_LENGTH,
  parseWordList,
  toLetterMask,
} from "./words";

describe("toLetterMask and countLetters", () => {
  it("gives one bit per different letter, so order and repeats do not matter", () => {
    expect(toLetterMask("abc")).toBe(0b111);
    expect(toLetterMask("cab")).toBe(toLetterMask("abc"));
    expect(toLetterMask("aabbcc")).toBe(toLetterMask("abc"));
    expect(toLetterMask("z")).toBe(1 << 25);
    expect(toLetterMask("")).toBe(0);
  });

  it("counts the different letters", () => {
    expect(countLetters(toLetterMask("balloon"))).toBe(5);
    expect(countLetters(0)).toBe(0);
    expect(countLetters(toLetterMask("abcdefghijklmnopqrstuvwxyz"))).toBe(26);
  });
});

describe("isAnswerable", () => {
  it("accepts words of four or more letters with at most seven different letters", () => {
    expect(MIN_WORD_LENGTH).toBe(4);
    expect(LETTER_COUNT).toBe(7);
    expect(isAnswerable("tree")).toBe(true);
    expect(isAnswerable("facility")).toBe(true);
    expect(isAnswerable("trail")).toBe(true);
    expect(isAnswerable("crazily")).toBe(true);
  });

  it("rejects short words and words with more than seven different letters", () => {
    expect(isAnswerable("cat")).toBe(false);
    expect(isAnswerable("dinosaur")).toBe(false);
  });

  it("rejects capitals, apostrophes, hyphens and digits", () => {
    ["Tree", "don't", "well-known", "tree2", "über"].forEach((word) => {
      expect(isAnswerable(word)).toBe(false);
    });
  });

  it("accepts a long word that repeats its letters", () => {
    expect(isAnswerable("nonannouncement")).toBe(false);
    expect(isAnswerable("balloonballoon")).toBe(true);
  });
});

describe("formatWordList and parseWordList", () => {
  const common = new Set(["tree", "trail"]);
  const text = formatWordList(["tree", "trail", "reef"], common, [
    "Notice line",
    "",
    "Second line",
  ]);

  it("puts the notice first, as comment lines", () => {
    expect(text.split("\n").slice(0, 3)).toEqual(["# Notice line", "#", "# Second line"]);
  });

  it("sorts the words and marks the common ones", () => {
    expect(text.split("\n").slice(3, 6)).toEqual(["reef", "trail*", "tree*"]);
  });

  it("ends with a single newline", () => {
    expect(text.endsWith("tree*\n")).toBe(true);
    expect(text.endsWith("\n\n")).toBe(false);
  });

  it("reads back the same words, common words and accepted set", () => {
    const list = parseWordList(text);
    expect(list.words).toEqual(["reef", "trail", "tree"]);
    expect([...list.common].sort()).toEqual(["trail", "tree"]);
    expect(list.accepted.has("reef")).toBe(true);
    expect(list.accepted.has("tree")).toBe(true);
    expect(list.accepted.has("tree*")).toBe(false);
  });

  it("ignores comments and blank lines", () => {
    const list = parseWordList("# note\n\nword\n\n# another\nlist*\n");
    expect(list.words).toEqual(["word", "list"]);
    expect(list.common.has("list")).toBe(true);
    expect(list.common.has("word")).toBe(false);
  });

  it("copes with an empty list", () => {
    expect(parseWordList("").words).toEqual([]);
    expect(parseWordList("# only a note\n").accepted.size).toBe(0);
  });
});
