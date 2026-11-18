import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { listDayIssues, verifyDays } from "./verify-days";
import { parseWordList } from "../../src/games/trail-words/words";

const wordText = readFileSync("src/games/trail-words/words.txt", "utf8");

describe("verifyDays", () => {
  it("accepts the first two years of puzzles", () => {
    expect(verifyDays(0, 730, wordText)).toEqual([]);
  });

  it("reports a day whose letters no longer give enough words", () => {
    const list = parseWordList(wordText);
    const thin = { ...list, common: new Set([...list.common].slice(0, 100)) };
    expect(listDayIssues(0, thin).length).toBeGreaterThan(0);
  });

  it("reports a day that has too many common words for its tier", () => {
    const list = parseWordList(wordText);
    const everythingCommon = { ...list, common: list.accepted };
    const issues = listDayIssues(0, everythingCommon);
    expect(issues.some((issue) => issue.includes("rules"))).toBe(true);
  });
});
