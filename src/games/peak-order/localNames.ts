import type { Locale } from "../../i18n/locales";
import type { CategoryId } from "./categories";
import type { PeakPuzzle } from "./puzzle";

export type LocalNames = Record<CategoryId, Record<string, string>>;

const loaders = import.meta.glob<{ default: LocalNames }>("./names.*.json");

export async function loadLocalNames(locale: Locale): Promise<LocalNames | null> {
  const load = loaders[`./names.${locale}.json`];
  return load ? (await load()).default : null;
}

export function localisePuzzle(puzzle: PeakPuzzle, names: LocalNames | null): PeakPuzzle {
  if (names === null) {
    return puzzle;
  }
  return {
    ...puzzle,
    items: puzzle.items.map((item) => ({
      ...item,
      name: names[puzzle.category][item.name] ?? item.name,
    })),
  };
}
