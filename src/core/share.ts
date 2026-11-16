import type { CompassDirection } from "./distance";
import { MAX_GUESSES, type GuessingState } from "./guessing";

const DIRECTION_EMOJI: Record<CompassDirection, string> = {
  N: "⬆️",
  NE: "↗️",
  E: "➡️",
  SE: "↘️",
  S: "⬇️",
  SW: "↙️",
  W: "⬅️",
  NW: "↖️",
};

const CORRECT_EMOJI = "🟩";

export function buildShareText(
  gameTitle: string,
  state: GuessingState,
  puzzleNumber: number,
  url?: string,
): string {
  const result =
    state.status === "won" ? `${state.guesses.length}/${MAX_GUESSES}` : `X/${MAX_GUESSES}`;
  const guessLine = state.guesses
    .map((guess) =>
      guess.feedback.isCorrect ? CORRECT_EMOJI : DIRECTION_EMOJI[guess.feedback.direction],
    )
    .join(" ");
  const lines = [`Dailyverse ${gameTitle} #${puzzleNumber} ${result}`, guessLine];
  if (url) {
    lines.push(url);
  }
  return lines.join("\n");
}
