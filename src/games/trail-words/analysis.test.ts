import { describe, expect, it } from "vitest";
import {
  findPangramSets,
  indexWords,
  listLetters,
  listWordsForLetters,
  measurePuzzle,
  scoreWord,
} from "./analysis";
import { toLetterMask } from "./words";

const WORDS = [
  "angel",
  "angle",
  "glean",
  "anger",
  "range",
  "grand",
  "lager",
  "large",
  "learn",
  "lane",
  "lean",
  "earn",
  "near",
  "dear",
  "read",
  "dare",
  "gear",
  "rage",
  "aged",
  "edge",
  "dread",
  "elder",
  "alder",
  "eager",
  "eagle",
  "legal",
  "regal",
  "gnarled",
  "enlarged",
  "tree",
  "sundial",
  "dials",
];

const SET = toLetterMask("adeglnr");
const bit = (letter: string) => letter.charCodeAt(0) - 97;
const COMMON = new Set(WORDS.filter((word) => word !== "enlarged" && word !== "dials"));

describe("indexWords", () => {
  it("groups words by the letters they use, whatever the order", () => {
    const index = indexWords(WORDS);
    const group = index.get(toLetterMask("angel"));
    expect(group).toEqual(expect.arrayContaining(["angel", "angle", "glean"]));
    expect(group).toHaveLength(3);
  });

  it("gives an empty index for no words", () => {
    expect(indexWords([]).size).toBe(0);
  });
});

describe("listLetters", () => {
  it("lists the letters of a mask as numbers from 0 for a, in order", () => {
    expect(listLetters(toLetterMask("cab"))).toEqual([0, 1, 2]);
    expect(listLetters(SET)).toEqual(["a", "d", "e", "g", "l", "n", "r"].map(bit));
    expect(listLetters(0)).toEqual([]);
  });
});

describe("listWordsForLetters", () => {
  const index = indexWords(WORDS);

  it("lists every word that uses only the given letters", () => {
    const words = listWordsForLetters(index, SET);
    expect(words).toEqual(expect.arrayContaining(["angel", "aged", "dear", "gnarled", "enlarged"]));
    expect(words).not.toContain("tree");
    expect(words).not.toContain("sundial");
    expect(words).not.toContain("dials");
  });

  it("matches a plain check of each word against the letters", () => {
    const expected = WORDS.filter((word) =>
      [...word].every((letter) => "adeglnr".includes(letter)),
    );
    expect([...listWordsForLetters(index, SET)].sort()).toEqual([...expected].sort());
  });

  it("includes words that use fewer of the letters", () => {
    expect(listWordsForLetters(index, SET)).toContain("aged");
  });

  it("gives nothing when no word fits", () => {
    expect(listWordsForLetters(index, toLetterMask("xyz"))).toEqual([]);
  });
});

describe("scoreWord", () => {
  it("gives a four-letter word one point", () => {
    expect(scoreWord("aged", SET)).toBe(1);
  });

  it("gives a longer word its length", () => {
    expect(scoreWord("angel", SET)).toBe(5);
    expect(scoreWord("dread", SET)).toBe(5);
  });

  it("adds seven for a pangram", () => {
    expect(scoreWord("gnarled", SET)).toBe(14);
    expect(scoreWord("enlarged", SET)).toBe(15);
  });
});

describe("findPangramSets", () => {
  const index = indexWords(WORDS);

  it("finds a set of seven letters with a common pangram", () => {
    expect(findPangramSets(index, COMMON)).toEqual([SET]);
  });

  it("needs the pangram to be a common word", () => {
    expect(findPangramSets(index, new Set(["enlarged"]))).toEqual([SET]);
    expect(findPangramSets(index, new Set(["angel"]))).toEqual([]);
    expect(findPangramSets(index, new Set())).toEqual([]);
  });

  it("leaves out sets that contain the letter s", () => {
    expect(findPangramSets(index, new Set(["sundial"]))).toEqual([]);
  });

  it("leaves out words that use fewer than seven letters", () => {
    expect(findPangramSets(indexWords(["angel", "dread"]), new Set(["angel", "dread"]))).toEqual(
      [],
    );
  });
});

describe("measurePuzzle", () => {
  const index = indexWords(WORDS);
  const words = listWordsForLetters(index, SET);

  it("counts only words that use the centre letter", () => {
    const metrics = measurePuzzle(words, SET, bit("g"), COMMON);
    expect(metrics.words).toBe(words.filter((word) => word.includes("g")).length);
    expect(metrics.commonWords).toBe(
      words.filter((word) => word.includes("g") && COMMON.has(word)).length,
    );
  });

  it("counts common and all pangrams separately", () => {
    const metrics = measurePuzzle(words, SET, bit("a"), COMMON);
    expect(metrics.commonPangrams).toBe(1);
    expect(metrics.allPangrams).toBe(2);
  });

  it("measures the share of four-letter words among the common ones", () => {
    const common = words.filter((word) => word.includes("e") && COMMON.has(word));
    const fours = common.filter((word) => word.length === 4);
    expect(measurePuzzle(words, SET, bit("e"), COMMON).fourLetterShare).toBeCloseTo(
      fours.length / common.length,
    );
  });

  it("adds up the score of the common words, with the pangram bonus", () => {
    const metrics = measurePuzzle(words, SET, bit("a"), COMMON);
    const expected = words
      .filter((word) => word.includes("a") && COMMON.has(word))
      .reduce((total, word) => total + scoreWord(word, SET), 0);
    expect(metrics.maxScore).toBe(expected);
  });

  it("gives zeros for a centre that no word uses, without dividing by zero", () => {
    const metrics = measurePuzzle([], SET, bit("a"), COMMON);
    expect(metrics).toEqual({
      words: 0,
      commonWords: 0,
      commonPangrams: 0,
      allPangrams: 0,
      fourLetterShare: 0,
      maxScore: 0,
    });
  });
});
