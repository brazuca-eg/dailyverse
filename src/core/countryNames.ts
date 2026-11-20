import { DEFAULT_LOCALE, readCurrentLocale, type Locale } from "../i18n/locales";
import type { Country } from "./types";

const displayNames = new Map<Locale, Intl.DisplayNames | null>();

function findDisplayNames(locale: Locale): Intl.DisplayNames | null {
  if (!displayNames.has(locale)) {
    try {
      displayNames.set(
        locale,
        new Intl.DisplayNames([locale], { type: "region", fallback: "none" }),
      );
    } catch {
      displayNames.set(locale, null);
    }
  }
  return displayNames.get(locale) ?? null;
}

function findName(code: string, locale: Locale): string | undefined {
  try {
    return findDisplayNames(locale)?.of(code);
  } catch {
    return undefined;
  }
}

export function readCountryName(country: Country, locale: Locale = readCurrentLocale()): string {
  if (locale === DEFAULT_LOCALE) {
    return country.name;
  }
  const name = findName(country.code, locale);
  return name && name !== country.code ? name : country.name;
}
