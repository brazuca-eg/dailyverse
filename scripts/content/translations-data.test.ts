import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { countries } from "../../src/core/countries";
import { LOCALES } from "../../src/i18n/locales";
import { loadLocalFacts } from "../../src/games/flag-fragment/facts";
import type { MysteryPlacePuzzle } from "../../src/games/mystery-place/types";
import { localisePuzzles } from "../../src/games/mystery-place/translations";
import { checkFlagFacts, checkMysteryTranslation } from "./translations";

function readJson<T>(relativePath: string): T {
  return JSON.parse(readFileSync(new URL(`../../${relativePath}`, import.meta.url), "utf8")) as T;
}

const english = readJson<MysteryPlacePuzzle[]>("src/games/mystery-place/puzzles.json");
const englishFacts = readJson<Record<string, { funFact: string }>>(
  "src/games/flag-fragment/facts.json",
);
const translatedLocales = LOCALES.filter((locale) => locale !== "en");

describe.each(translatedLocales)("translated puzzle content in %s", (locale) => {
  const mystery = readJson<Record<string, { clues: string[]; funFact: string }>>(
    `src/games/mystery-place/puzzles.${locale}.json`,
  );
  const facts = readJson<Record<string, { funFact: string }>>(
    `src/games/flag-fragment/facts.${locale}.json`,
  );

  it("has every Mystery Place puzzle, with no clue that gives away the answer", () => {
    expect(checkMysteryTranslation(locale, english, mystery, countries)).toEqual([]);
  });

  it("has a fact for every flag", () => {
    expect(checkFlagFacts(englishFacts, facts)).toEqual([]);
  });

  it("is really translated, not copied from English", () => {
    const same = english.flatMap((puzzle, index) =>
      puzzle.clues.filter(
        (clue, clueIndex) => mystery[puzzle.id].clues[clueIndex] === clue.text && index >= 0,
      ),
    );
    expect(same).toEqual([]);
    const sameFacts = Object.keys(englishFacts).filter(
      (code) => facts[code].funFact === englishFacts[code].funFact,
    );
    expect(sameFacts).toEqual([]);
  });

  it("is used for the puzzles of that language", () => {
    const local = localisePuzzles(english, locale);
    expect(local[0].clues[0].text).toBe(mystery[english[0].id].clues[0]);
    expect(local[0].clues[0].text).not.toBe(english[0].clues[0].text);
  });

  it("is loaded for the flag facts of that language", async () => {
    const loaded = await loadLocalFacts(locale);
    expect(loaded?.ES?.funFact).toBe(facts.ES.funFact);
  });
});
