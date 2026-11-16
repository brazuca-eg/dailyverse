import { useMemo } from "react";
import { calculateDaysSinceLaunch, pickDailyItem } from "../../core/daily";
import { findCountryByCode } from "../../core/search";
import type { Country } from "../../core/types";
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
  return useMemo(() => {
    const dayIndex = calculateDaysSinceLaunch(new Date(), launchDate);
    const puzzle = pickDailyItem(puzzles, dayIndex);
    return { dayIndex, puzzle, answer: findCountryByCode(countries, puzzle.country) };
  }, [puzzles, countries, launchDate]);
}
