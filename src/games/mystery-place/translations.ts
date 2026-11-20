import type { Locale } from "../../i18n/locales";
import type { MysteryPlacePuzzle } from "./types";

export interface TranslatedPuzzle {
  clues: string[];
  funFact: string;
}

const files = import.meta.glob<Record<string, TranslatedPuzzle>>("./puzzles.*.json", {
  eager: true,
  import: "default",
});

export function localisePuzzles(
  puzzles: readonly MysteryPlacePuzzle[],
  locale: Locale,
  translations: Record<string, TranslatedPuzzle> | undefined = files[`./puzzles.${locale}.json`],
): MysteryPlacePuzzle[] {
  if (translations === undefined) {
    return [...puzzles];
  }
  return puzzles.map((puzzle) => {
    const translated = translations[puzzle.id];
    if (translated === undefined) {
      return puzzle;
    }
    return {
      ...puzzle,
      clues: puzzle.clues.map((clue, index) => ({
        ...clue,
        text: translated.clues[index] ?? clue.text,
      })) as MysteryPlacePuzzle["clues"],
      reveal: { ...puzzle.reveal, funFact: translated.funFact || puzzle.reveal.funFact },
    };
  });
}
