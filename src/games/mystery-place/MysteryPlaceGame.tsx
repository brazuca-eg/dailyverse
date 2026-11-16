import type { Country } from "../../core/types";
import { DailyGame } from "./DailyGame";
import type { MysteryPlacePuzzle } from "./types";
import { useTodaysPuzzle } from "./useTodaysPuzzle";

interface MysteryPlaceGameProps {
  puzzles: readonly MysteryPlacePuzzle[];
  countries: readonly Country[];
  launchDate: Date;
}

export function MysteryPlaceGame({ puzzles, countries, launchDate }: MysteryPlaceGameProps) {
  const { dayIndex, puzzle, answer } = useTodaysPuzzle(puzzles, countries, launchDate);
  if (!answer) {
    return <p>Today's puzzle could not be loaded.</p>;
  }
  return <DailyGame puzzle={puzzle} answer={answer} countries={countries} dayIndex={dayIndex} />;
}
