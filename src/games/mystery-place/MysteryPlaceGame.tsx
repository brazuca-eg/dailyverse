import type { Country } from "../../core/types";
import { DailyGame } from "./DailyGame";
import { mysteryMessages as t } from "./messages";
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
    return <p>{t("mystery.loadError")}</p>;
  }
  return <DailyGame puzzle={puzzle} answer={answer} countries={countries} dayIndex={dayIndex} />;
}
