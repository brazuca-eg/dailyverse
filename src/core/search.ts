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

function calculateMatchRank(country: Country, query: string): number | null {
  const name = normalizeSearchText(country.name);
  const aliases = country.aliases.map(normalizeSearchText);
  if (name === query || aliases.includes(query)) {
    return MATCH_RANK.exact;
  }
  if (name.startsWith(query)) {
    return MATCH_RANK.namePrefix;
  }
  if (aliases.some((alias) => alias.startsWith(query))) {
    return MATCH_RANK.aliasPrefix;
  }
  if (name.includes(query) || aliases.some((alias) => alias.includes(query))) {
    return MATCH_RANK.contains;
  }
  return null;
}

export function findCountryByCode(countries: readonly Country[], code: string): Country | null {
  return countries.find((country) => country.code === code) ?? null;
}

export function findCountryByName(countries: readonly Country[], query: string): Country | null {
  const normalizedQuery = normalizeSearchText(query);
  if (normalizedQuery === "") {
    return null;
  }
  return (
    countries.find(
      (country) =>
        normalizeSearchText(country.name) === normalizedQuery ||
        country.aliases.some((alias) => normalizeSearchText(alias) === normalizedQuery),
    ) ?? null
  );
}

export function searchCountries(
  countries: readonly Country[],
  query: string,
  excludedCodes: readonly string[] = [],
  limit: number = DEFAULT_RESULT_LIMIT,
): Country[] {
  const normalizedQuery = normalizeSearchText(query);
  if (normalizedQuery === "") {
    return [];
  }
  return countries
    .filter((country) => !excludedCodes.includes(country.code))
    .map((country) => ({ country, rank: calculateMatchRank(country, normalizedQuery) }))
    .filter((match): match is { country: Country; rank: number } => match.rank !== null)
    .sort((a, b) => a.rank - b.rank || a.country.name.localeCompare(b.country.name))
    .slice(0, limit)
    .map((match) => match.country);
}
