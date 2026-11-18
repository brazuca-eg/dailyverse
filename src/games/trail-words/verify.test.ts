import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { TIER_RULES, type TrailTier } from "./tiers";
import { MIN_POOL_SIZE, verifyTrailData } from "./verify";

const wordText = readFileSync(resolve("src/games/trail-words/words.txt"), "utf8");
const puzzles = JSON.parse(
  readFileSync(resolve("src/games/trail-words/puzzles.json"), "utf8"),
) as Record<TrailTier, string[]>;

function swapIn(tier: TrailTier, code: string): Record<TrailTier, string[]> {
  return { ...puzzles, [tier]: [code, ...puzzles[tier].slice(1)] };
}

describe("the shipped word data", () => {
  it("passes every check", () => {
    expect(verifyTrailData(wordText, puzzles)).toEqual([]);
  });

  it("has a pool of puzzles for each tier, enough for years of days", () => {
    expect(puzzles.medium.length).toBeGreaterThanOrEqual(MIN_POOL_SIZE);
    expect(puzzles.hard.length).toBeGreaterThanOrEqual(MIN_POOL_SIZE);
    expect(puzzles.medium.length).toBeLessThanOrEqual(TIER_RULES.medium.poolSize);
    expect(puzzles.hard.length).toBeLessThanOrEqual(TIER_RULES.hard.poolSize);
  });

  it("keeps the copyright notice at the top of the word list", () => {
    expect(wordText.startsWith("# Trail Words word list.")).toBe(true);
    expect(wordText).toContain("Copyright 2000-2026 by Kevin Atkinson");
    expect(wordText).toContain("CC BY 4.0");
  });

  it("does not accept the words that were blocked", () => {
    const words = new Set(wordText.split("\n"));
    ["fuck", "shit", "nigger", "retard", "pimp", "moron"].forEach((word) => {
      expect(words.has(word)).toBe(false);
      expect(words.has(`${word}*`)).toBe(false);
    });
  });

  it("does not accept abbreviations", () => {
    const words = new Set(wordText.split("\n").map((line) => line.replace("*", "")));
    ["acct", "dept", "atty", "bldg", "blvd"].forEach((word) => expect(words.has(word)).toBe(false));
  });
});

describe("verifyTrailData", () => {
  it("reports a letter set that contains the letter s", () => {
    const issues = verifyTrailData(wordText, swapIn("medium", "asdfghj"));
    expect(issues.some((issue) => issue.includes("contains the letter s"))).toBe(true);
  });

  it("reports a puzzle that belongs in the other tier", () => {
    const issues = verifyTrailData(wordText, swapIn("hard", puzzles.medium[5]));
    expect(issues.some((issue) => issue.includes("does not fit the hard rules"))).toBe(true);
    expect(issues.some((issue) => issue.includes("appears more than once"))).toBe(true);
  });

  it("reports a code that is not seven different letters", () => {
    const issues = verifyTrailData(wordText, swapIn("medium", "abc"));
    expect(issues.some((issue) => issue.includes("is not seven different letters"))).toBe(true);
  });

  it("reports a pool that is too small", () => {
    const issues = verifyTrailData(wordText, {
      medium: puzzles.medium.slice(0, 10),
      hard: puzzles.hard,
    });
    expect(issues).toContain(`medium has only 10 puzzles, fewer than ${MIN_POOL_SIZE}`);
  });

  it("reports a blocked word that is back in the list", () => {
    const issues = verifyTrailData(`${wordText}pimp\n`, puzzles);
    expect(issues.some((issue) => issue.includes('"pimp" is blocked'))).toBe(true);
  });

  it("reports a word that cannot be an answer, and a duplicate word", () => {
    const issues = verifyTrailData(`${wordText}cat\ntree\ntree\n`, puzzles);
    expect(
      issues.some((issue) => issue.includes('"cat" is in the word list but cannot be an answer')),
    ).toBe(true);
    expect(issues).toContain("the word list has duplicates");
  });
});
