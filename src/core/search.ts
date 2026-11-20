import { readCurrentLocale, type Locale } from "../i18n/locales";
import { readCountryName } from "./countryNames";
import { foldText } from "./text";
import type { Country } from "./types";

const DEFAULT_RESULT_LIMIT = 8;

const MATCH_RANK = {
  exact: 0,
  namePrefix: 1,
  aliasPrefix: 2,
  contains: 3,
} as const;

function normalizeSearchText(text: string): string {
  return foldText(text).trim();
}

function listNames(country: Country, locale: Locale): string[] {
  return [...new Set([readCountryName(country, locale), country.name])].map(normalizeSearchText);
}

function calculateMatchRank(country: Country, query: string, locale: Locale): number | null {
  const names = listNames(country, locale);
  const aliases = country.aliases.map(normalizeSearchText);
  if (names.includes(query) || aliases.includes(query)) {
    return MATCH_RANK.exact;
  }
  if (names.some((name) => name.startsWith(query))) {
    return MATCH_RANK.namePrefix;
  }
  if (aliases.some((alias) => alias.startsWith(query))) {
    return MATCH_RANK.aliasPrefix;
  }
  if (
    names.some((name) => name.includes(query)) ||
    aliases.some((alias) => alias.includes(query))
  ) {
    return MATCH_RANK.contains;
  }
  return null;
}

export function findCountryByCode(countries: readonly Country[], code: string): Country | null {
  return countries.find((country) => country.code === code) ?? null;
}

export function findCountryByName(
  countries: readonly Country[],
  query: string,
  locale: Locale = readCurrentLocale(),
): Country | null {
  const normalizedQuery = normalizeSearchText(query);
  if (normalizedQuery === "") {
    return null;
  }
  return (
    countries.find(
      (country) =>
        listNames(country, locale).includes(normalizedQuery) ||
        country.aliases.some((alias) => normalizeSearchText(alias) === normalizedQuery),
    ) ?? null
  );
}

export function searchCountries(
  countries: readonly Country[],
  query: string,
  excludedCodes: readonly string[] = [],
  limit: number = DEFAULT_RESULT_LIMIT,
  locale: Locale = readCurrentLocale(),
): Country[] {
  const normalizedQuery = normalizeSearchText(query);
  if (normalizedQuery === "") {
    return [];
  }
  return countries
    .filter((country) => !excludedCodes.includes(country.code))
    .map((country) => ({ country, rank: calculateMatchRank(country, normalizedQuery, locale) }))
    .filter((match): match is { country: Country; rank: number } => match.rank !== null)
    .sort(
      (a, b) =>
        a.rank - b.rank ||
        readCountryName(a.country, locale).localeCompare(
          readCountryName(b.country, locale),
          locale,
        ),
    )
    .slice(0, limit)
    .map((match) => match.country);
}
