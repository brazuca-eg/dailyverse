import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { countries } from "../../core/countries";
import { EASY_FLAG_CODES, HARD_FLAG_CODES } from "../../../scripts/flags/difficulty";
import { flagEntries } from "./data";
import { DIFFICULTIES } from "../../core/difficulty";

const MIN_FOCUS = 0.125;
const MAX_FOCUS = 0.875;
const MIN_PER_DIFFICULTY = 30;

function countByDifficulty(difficulty: string): number {
  return flagEntries.filter((entry) => entry.difficulty === difficulty).length;
}

describe("flag fragment data", () => {
  it("has exactly one entry for every country, in the same order", () => {
    expect(flagEntries.map((entry) => entry.code)).toEqual(
      countries.map((country) => country.code),
    );
  });

  it("has a flag image for every entry", () => {
    const missing = flagEntries.filter(
      (entry) =>
        !existsSync(
          new URL(
            `../../../node_modules/flag-icons/flags/4x3/${entry.code.toLowerCase()}.svg`,
            import.meta.url,
          ),
        ),
    );
    expect(missing).toEqual([]);
  });

  it("uses only known difficulties", () => {
    flagEntries.forEach((entry) => expect(DIFFICULTIES).toContain(entry.difficulty));
  });

  it("keeps the crop focus where a whole starting crop fits inside the flag", () => {
    flagEntries.forEach((entry) => {
      expect(entry.focus.x).toBeGreaterThanOrEqual(MIN_FOCUS);
      expect(entry.focus.x).toBeLessThanOrEqual(MAX_FOCUS);
      expect(entry.focus.y).toBeGreaterThanOrEqual(MIN_FOCUS);
      expect(entry.focus.y).toBeLessThanOrEqual(MAX_FOCUS);
    });
  });

  it("has enough flags in every difficulty to follow a weekly pattern", () => {
    DIFFICULTIES.forEach((difficulty) => {
      expect(countByDifficulty(difficulty)).toBeGreaterThanOrEqual(MIN_PER_DIFFICULTY);
    });
  });

  it("only classifies countries that exist, and never as both easy and hard", () => {
    const codes = countries.map((country) => country.code);
    [...EASY_FLAG_CODES, ...HARD_FLAG_CODES].forEach((code) => expect(codes).toContain(code));
    expect(EASY_FLAG_CODES.filter((code) => HARD_FLAG_CODES.includes(code))).toEqual([]);
  });

  it("matches the difficulty lists", () => {
    flagEntries.forEach((entry) => {
      if (EASY_FLAG_CODES.includes(entry.code)) {
        expect(entry.difficulty).toBe("easy");
      } else if (HARD_FLAG_CODES.includes(entry.code)) {
        expect(entry.difficulty).toBe("hard");
      } else {
        expect(entry.difficulty).toBe("medium");
      }
    });
  });
});
