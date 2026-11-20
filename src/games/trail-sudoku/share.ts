import { formatElapsed } from "../../core/elapsed";
import { gameMeta } from "./meta";
import { sudokuMessages as t } from "./messages";
import type { SudokuState } from "./game";

export function buildShareText(
  state: SudokuState,
  size: number,
  puzzleNumber: number,
  url?: string,
): string {
  const result = state.status === "won" ? t("sudoku.share.won") : t("sudoku.share.lost");
  const lines = [
    `Dailyverse ${gameMeta("meta.sudoku.title")} #${puzzleNumber} · ${size}x${size} · ${result}`,
    `⏱ ${formatElapsed(state.elapsedSeconds)} · 🔎 ${t("sudoku.share.checks", { count: state.checks })} · 💡 ${t("sudoku.share.hints", { count: state.hints })}`,
  ];
  return [...lines, ...(url ? [url] : [])].join("\n");
}
