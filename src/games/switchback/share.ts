import { formatElapsed, pluralise } from "../../core/elapsed";
import type { SwitchbackState } from "./game";

export function buildShareText(
  state: SwitchbackState,
  size: number,
  puzzleNumber: number,
  url?: string,
): string {
  const result = state.status === "won" ? "summit reached" : "gave up";
  const lines = [
    `Dailyverse Switchback #${puzzleNumber} · ${size}x${size} · ${result}`,
    `⏱ ${formatElapsed(state.elapsedSeconds)} · 💡 ${pluralise(state.hints, "hint")}`,
  ];
  return [...lines, ...(url ? [url] : [])].join("\n");
}
