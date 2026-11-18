import { formatElapsed, pluralise } from "../../core/elapsed";
import { countEncounters, type BearState } from "./game";

export function buildShareText(
  state: BearState,
  size: number,
  puzzleNumber: number,
  url?: string,
): string {
  const result = state.status === "won" ? "all clear" : "chased off";
  const lines = [
    `Dailyverse Bear Sweeper #${puzzleNumber} · ${size}x${size} · ⏱ ${formatElapsed(state.elapsedSeconds)} · ${result}`,
    `🐻 ${pluralise(countEncounters(state), "encounter")} · 💡 ${pluralise(state.hints, "hint")}`,
  ];
  return [...lines, ...(url ? [url] : [])].join("\n");
}
