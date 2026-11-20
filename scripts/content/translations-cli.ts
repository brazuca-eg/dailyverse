import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { countries } from "../../src/core/countries";
import { LOCALES, isLocale, type Locale } from "../../src/i18n/locales";
import type { MysteryPlacePuzzle } from "../../src/games/mystery-place/types";
import {
  checkFlagFacts,
  checkMysteryTranslation,
  type TranslatedFact,
  type TranslatedPuzzle,
} from "./translations";

const ROOT = new URL("../../", import.meta.url);

function readJson<T>(relativePath: string): T {
  return JSON.parse(readFileSync(fileURLToPath(new URL(relativePath, ROOT)), "utf8")) as T;
}

function fileExists(relativePath: string): boolean {
  return existsSync(fileURLToPath(new URL(relativePath, ROOT)));
}

function checkLocale(locale: Exclude<Locale, "en">): string[] {
  const mysteryPath = `src/games/mystery-place/puzzles.${locale}.json`;
  const factsPath = `src/games/flag-fragment/facts.${locale}.json`;
  const mystery = fileExists(mysteryPath)
    ? checkMysteryTranslation(
        locale,
        readJson<MysteryPlacePuzzle[]>("src/games/mystery-place/puzzles.json"),
        readJson<Record<string, TranslatedPuzzle>>(mysteryPath),
        countries,
      )
    : [`${mysteryPath} does not exist`];
  const facts = fileExists(factsPath)
    ? checkFlagFacts(
        readJson<Record<string, { funFact: string }>>("src/games/flag-fragment/facts.json"),
        readJson<Record<string, TranslatedFact>>(factsPath),
      )
    : [`${factsPath} does not exist`];
  return [
    ...mystery.map((issue) => `mystery ${locale}: ${issue}`),
    ...facts.map((issue) => `flags ${locale}: ${issue}`),
  ];
}

const requested = process.argv[2];
const locales = LOCALES.filter(
  (locale): locale is Exclude<Locale, "en"> =>
    locale !== "en" && (requested === undefined || requested === locale),
);
if (requested !== undefined && !isLocale(requested)) {
  console.error(`Unknown language ${requested}`);
  process.exitCode = 1;
}
const issues = locales.flatMap(checkLocale);
if (issues.length > 0) {
  issues.slice(0, 80).forEach((issue) => console.error(issue));
  console.error(`${issues.length} problem(s)`);
  process.exitCode = 1;
} else {
  console.log(`Translations are valid: ${locales.join(", ")}`);
}
