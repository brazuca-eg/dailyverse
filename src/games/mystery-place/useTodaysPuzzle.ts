import { findCountryByCode } from "../../core/search";
import type { Country } from "../../core/types";
import { useTodaysItem } from "../../hooks/useTodaysItem";
import type { MysteryPlacePuzzle } from "./types";

export interface TodaysPuzzle {
  dayIndex: number;
  puzzle: MysteryPlacePuzzle;
  answer: Country | null;
}

export function useTodaysPuzzle(
  puzzles: readonly MysteryPlacePuzzle[],
  countries: readonly Country[],
  launchDate: Date,
): TodaysPuzzle {
  const { dayIndex, item: puzzle } = useTodaysItem(puzzles, launchDate);
  return { dayIndex, puzzle, answer: findCountryByCode(countries, puzzle.country) };
}
