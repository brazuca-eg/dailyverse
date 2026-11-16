import { DIFFERENCE_COUNT } from "./difficulty";
import { MAX_LIVES, countLivesLeft, type SpotState } from "./game";

const LIFE_EMOJI = "❤️";
const LOST_LIFE_EMOJI = "🤍";

export function buildShareText(state: SpotState, puzzleNumber: number, url?: string): string {
  const hearts =
    LIFE_EMOJI.repeat(countLivesLeft(state)) +
    LOST_LIFE_EMOJI.repeat(MAX_LIVES - countLivesLeft(state));
  const lines = [
    `Dailyverse Spot the Difference #${puzzleNumber} ${state.found.length}/${DIFFERENCE_COUNT}`,
    hearts,
  ];
  if (url) {
    lines.push(url);
  }
  return lines.join("\n");
}
