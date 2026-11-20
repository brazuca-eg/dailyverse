import { gameMeta } from "./meta";
import { MAX_CHECKS, readCheckRows, readStatus, type PeakState } from "./game";
import { peakMessages as t } from "./messages";
import type { PeakPuzzle } from "./puzzle";

const RIGHT = "🟩";
const WRONG = "⬜";

export function buildShareText(
  puzzle: PeakPuzzle,
  state: PeakState,
  puzzleNumber: number,
  url?: string,
): string {
  const result = readStatus(state) === "won" ? state.history.length : "X";
  const category = t(`peak.category.${puzzle.category}`);
  const header = `Dailyverse ${gameMeta("meta.peak.title")} #${puzzleNumber} · ${category} · ${result}/${MAX_CHECKS}`;
  const rows = readCheckRows(state).map((row) => row.map((ok) => (ok ? RIGHT : WRONG)).join(""));
  return [header, ...rows, ...(url ? [url] : [])].join("\n");
}
