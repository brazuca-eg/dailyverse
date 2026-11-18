import { formatElapsed, pluralise } from "../../core/elapsed";
import type { SudokuState } from "./game";

export function buildShareText(
  state: SudokuState,
  size: number,
  puzzleNumber: number,
  url?: string,
): string {
  const result = state.status === "won" ? "solved" : "gave up";
  const lines = [
    `Dailyverse Trail Sudoku #${puzzleNumber} · ${size}x${size} · ${result}`,
    `⏱ ${formatElapsed(state.elapsedSeconds)} · 🔎 ${pluralise(state.checks, "check")} · 💡 ${pluralise(state.hints, "hint")}`,
  ];
  return [...lines, ...(url ? [url] : [])].join("\n");
}
