import { findStoredValue, saveStoredValue, type KeyValueStore } from "./storage";

export const FAVOURITES_KEY = "dailyverse:favourites";

function isFavourites(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

export function loadFavourites(store?: KeyValueStore | null): string[] {
  return [...new Set(findStoredValue(FAVOURITES_KEY, isFavourites, store) ?? [])];
}

export function isFavourite(slug: string, store?: KeyValueStore | null): boolean {
  return loadFavourites(store).includes(slug);
}

export function toggleFavourite(slug: string, store?: KeyValueStore | null): string[] {
  const current = loadFavourites(store);
  const next = current.includes(slug)
    ? current.filter((candidate) => candidate !== slug)
    : [...current, slug];
  saveStoredValue(FAVOURITES_KEY, next, store);
  return next;
}
