import { pluralise } from "../../core/elapsed";
import { MAX_SCORE, calculateScore, type WeatherState } from "./game";
import { analysePuzzle, scorePlan } from "./solver";
import type { WeatherPuzzle } from "./types";

export function buildShareText(
  state: WeatherState,
  puzzle: WeatherPuzzle,
  puzzleNumber: number,
  url?: string,
): string {
  const score = calculateScore(state, puzzle);
  const stars = "★".repeat(score) + "☆".repeat(MAX_SCORE - score);
  const points = `${scorePlan(puzzle, state.plan)}/${analysePuzzle(puzzle).best} pts`;
  const lines = [
    `Dailyverse Weather Window #${puzzleNumber} · ${pluralise(puzzle.weather.length, "day")} · ${stars} · ${points}`,
    `👀 ${pluralise(state.peeksUsed, "peek")}`,
  ];
  return [...lines, ...(url ? [url] : [])].join("\n");
}
