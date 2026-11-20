import { formatElapsed } from "../../core/elapsed";
import type { TentsState } from "./game";
import { gameMeta } from "./meta";
import { tentsMessages } from "./messages";

export function buildShareText(
  state: TentsState,
  size: number,
  puzzleNumber: number,
  url?: string,
): string {
  const result = state.status === "won" ? "⛺" : tentsMessages("tents.share.gaveUp");
  const checks = tentsMessages("tents.share.checks", { count: state.checks });
  const hints = tentsMessages("tents.share.hints", { count: state.hints });
  const lines = [
    `Dailyverse ${gameMeta("meta.tents.title")} #${puzzleNumber} ${size}x${size} ${result}`,
    `⏱ ${formatElapsed(state.elapsedSeconds)} · 🔎 ${checks} · 💡 ${hints}`,
  ];
  if (url) {
    lines.push(url);
  }
  return lines.join("\n");
}
