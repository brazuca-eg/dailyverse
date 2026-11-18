import { formatElapsed, pluralise } from "../../core/elapsed";
import type { TentsState } from "./game";

export function buildShareText(
  state: TentsState,
  size: number,
  puzzleNumber: number,
  url?: string,
): string {
  const result = state.status === "won" ? "⛺" : "gave up";
  const lines = [
    `Dailyverse Tents and Trees #${puzzleNumber} ${size}x${size} ${result}`,
    `⏱ ${formatElapsed(state.elapsedSeconds)} · 🔎 ${pluralise(state.checks, "check")} · 💡 ${pluralise(state.hints, "hint")}`,
  ];
  if (url) {
    lines.push(url);
  }
  return lines.join("\n");
}
