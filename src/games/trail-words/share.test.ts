import { describe, expect, it } from "vitest";
import { pickDailyTrailPuzzle } from "./daily";
import { buildTrailPuzzle } from "./puzzle";
import { buildShareText } from "./share";
import { readRealWordList } from "./testing";
import { createInitialState } from "./game";

const { code, tier } = pickDailyTrailPuzzle(6);
const puzzle = buildTrailPuzzle(code, tier, readRealWordList());
const pangram = puzzle.pangrams.find((word) => puzzle.common.has(word)) as string;
const other = [...puzzle.common].find((word) => !puzzle.pangrams.includes(word)) as string;

describe("buildShareText", () => {
  it("shows the day, rank and word count with no word given away", () => {
    const state = { ...createInitialState(code), found: [other] };
    const text = buildShareText(puzzle, state, 7);
    expect(text).toBe(`Dailyverse Trail Words #7 · Beginner · 1/${puzzle.common.size} words`);
    expect(text).not.toContain(other);
  });

  it("says when the pangram was found, without naming it", () => {
    const state = { ...createInitialState(code), found: [other, pangram] };
    const text = buildShareText(puzzle, state, 7);
    expect(text).toContain(`2/${puzzle.common.size} words · pangram found`);
    expect(text).not.toContain(pangram);
  });

  it("uses the rank for the score", () => {
    const state = { ...createInitialState(code), found: [...puzzle.common] };
    expect(buildShareText(puzzle, state, 1)).toContain("· Summit ·");
  });

  it("counts only common words in the total", () => {
    const rare = puzzle.words.find((word) => !puzzle.common.has(word));
    const state = { ...createInitialState(code), found: rare ? [rare] : [] };
    expect(buildShareText(puzzle, state, 1)).toContain(`· 0/${puzzle.common.size} words`);
  });

  it("adds the link on its own line", () => {
    const text = buildShareText(
      puzzle,
      createInitialState(code),
      3,
      "https://dailyverse.example/trail-words",
    );
    expect(text.split("\n")).toEqual([
      `Dailyverse Trail Words #3 · Beginner · 0/${puzzle.common.size} words`,
      "https://dailyverse.example/trail-words",
    ]);
  });
});
