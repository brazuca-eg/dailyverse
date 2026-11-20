import { findStoredValue, saveStoredValue, type KeyValueStore } from "../core/storage";
import { isLocale, type Locale } from "./locales";

export const LOCALE_KEY = "dailyverse:locale";

export function readLocalePreference(store?: KeyValueStore | null): Locale | null {
  return findStoredValue(LOCALE_KEY, isLocale, store);
}

export function saveLocalePreference(locale: Locale, store?: KeyValueStore | null): boolean {
  return saveStoredValue(LOCALE_KEY, locale, store);
}
