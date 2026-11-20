import { MAX_SCORE, calculateScore, type WeatherState } from "./game";
import { gameMeta } from "./meta";
import { t } from "./messages";
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
  const points = `${scorePlan(puzzle, state.plan)}/${analysePuzzle(puzzle).best}`;
  const lines = [
    t("weather.share.headline", {
      title: gameMeta("meta.weather.title"),
      number: puzzleNumber,
      days: t("weather.share.days", { count: puzzle.weather.length }),
      stars,
      points,
    }),
    `👀 ${t("weather.share.peeks", { count: state.peeksUsed })}`,
  ];
  return [...lines, ...(url ? [url] : [])].join("\n");
}
