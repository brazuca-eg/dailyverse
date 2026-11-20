import { readCountryName } from "../../src/core/countryNames";
import { foldText } from "../../src/core/text";
import type { Country } from "../../src/core/types";
import type { Locale } from "../../src/i18n/locales";
import type { MysteryPlacePuzzle } from "../../src/games/mystery-place/types";

export interface TranslatedPuzzle {
  clues: string[];
  funFact: string;
}

export interface TranslatedFact {
  funFact: string;
}

const CLUE_COUNT = 5;
const MIN_TEXT_LENGTH = 10;
const MAX_CLUE_LENGTH = 260;
const MAX_FACT_LENGTH = 420;
const MIN_STEM_NAME_LENGTH = 6;

const NUMBER_PATTERN = /\d{1,3}(?:[.,\s\u00a0\u202f]\d{3})+(?!\d)|\d+/g;
const OPTIONAL_PATTERN = /\b\d{1,3}(?:st|nd|rd|th)\b|\b\d{4}s\b/gi;
const RANGE_PATTERN = /(?<![\d.,])(\d{2})(\d{2})\s*[-\u2013]\s*(\d{2})(?!\d)/g;

export function extractNumberTokens(text: string): string[] {
  const matches = text.match(NUMBER_PATTERN) ?? [];
  return matches.map((match) => match.replace(/\D/g, ""));
}

function expandRanges(text: string): string {
  return text.replace(
    RANGE_PATTERN,
    (_match, century: string, start: string, end: string) => `${century}${start} ${century}${end}`,
  );
}

function listMissingNumbers(english: string, translated: string): string[] {
  const found = new Set(extractNumberTokens(expandRanges(translated)));
  return extractNumberTokens(expandRanges(english.replace(OPTIONAL_PATTERN, ""))).filter(
    (token) => !found.has(token),
  );
}

function listMissingKeys(expected: readonly string[], actual: readonly string[]): string[] {
  const known = new Set(actual);
  return expected.filter((key) => !known.has(key));
}

function listExtraKeys(expected: readonly string[], actual: readonly string[]): string[] {
  const known = new Set(expected);
  return actual.filter((key) => !known.has(key));
}

export function findLeakedNames(text: string, country: Country, locale: Locale): string[] {
  const folded = foldText(text);
  const names = [readCountryName(country, locale), country.name, ...country.aliases];
  return names.filter((name) => {
    const word = foldText(name);
    const stem = word.length >= MIN_STEM_NAME_LENGTH ? word.slice(0, -1) : word;
    return stem.length > 0 && folded.includes(stem);
  });
}

function checkText(where: string, english: string, translated: unknown, max: number): string[] {
  if (typeof translated !== "string" || translated.trim().length < MIN_TEXT_LENGTH) {
    return [`${where}: missing or too short`];
  }
  const issues = translated.length > max ? [`${where}: longer than ${max} characters`] : [];
  const missing = listMissingNumbers(english, translated);
  return missing.length > 0
    ? [...issues, `${where}: the numbers ${missing.join(", ")} are missing`]
    : issues;
}

export function checkMysteryTranslation(
  locale: Locale,
  english: readonly MysteryPlacePuzzle[],
  translations: Readonly<Record<string, TranslatedPuzzle>>,
  countries: readonly Country[],
): string[] {
  const ids = english.map((puzzle) => puzzle.id);
  const keyIssues = [
    ...listMissingKeys(ids, Object.keys(translations)).map((id) => `${id}: not translated`),
    ...listExtraKeys(ids, Object.keys(translations)).map((id) => `${id}: not a puzzle`),
  ];
  const puzzleIssues = english.flatMap((puzzle) => {
    const translated = translations[puzzle.id];
    if (translated === undefined) {
      return [];
    }
    const country = countries.find((candidate) => candidate.code === puzzle.country);
    const clues = Array.isArray(translated.clues) ? translated.clues : [];
    const clueIssues =
      clues.length === CLUE_COUNT
        ? puzzle.clues.flatMap((clue, index) => {
            const where = `${puzzle.id} clue ${index + 1}`;
            const leaks = country ? findLeakedNames(String(clues[index]), country, locale) : [];
            return [
              ...checkText(where, clue.text, clues[index], MAX_CLUE_LENGTH),
              ...leaks.map((name) => `${where}: gives away the answer ("${name}")`),
            ];
          })
        : [`${puzzle.id}: needs exactly ${CLUE_COUNT} clues`];
    return [
      ...clueIssues,
      ...checkText(
        `${puzzle.id} fun fact`,
        puzzle.reveal.funFact,
        translated.funFact,
        MAX_FACT_LENGTH,
      ),
    ];
  });
  return [...keyIssues, ...puzzleIssues];
}

export function checkFlagFacts(
  english: Readonly<Record<string, { funFact: string }>>,
  translations: Readonly<Record<string, TranslatedFact>>,
): string[] {
  const codes = Object.keys(english);
  const keyIssues = [
    ...listMissingKeys(codes, Object.keys(translations)).map((code) => `${code}: not translated`),
    ...listExtraKeys(codes, Object.keys(translations)).map((code) => `${code}: not a flag`),
  ];
  const factIssues = codes.flatMap((code) =>
    translations[code] === undefined
      ? []
      : checkText(
          `${code} fact`,
          english[code].funFact,
          translations[code].funFact,
          MAX_FACT_LENGTH,
        ),
  );
  return [...keyIssues, ...factIssues];
}
