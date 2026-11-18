import { CATEGORIES } from "./categories";
import { MAX_CHECKS, readCheckRows, readStatus, type PeakState } from "./game";
import type { PeakPuzzle } from "./puzzle";

const RIGHT = "🟩";
const WRONG = "⬜";

export function buildShareText(
  puzzle: PeakPuzzle,
  state: PeakState,
  puzzleNumber: number,
  url?: string,
): string {
  const result = readStatus(state) === "won" ? String(state.history.length) : "X";
  const header = `Dailyverse Peak Order #${puzzleNumber} · ${CATEGORIES[puzzle.category].title} · ${result}/${MAX_CHECKS}`;
  const rows = readCheckRows(state).map((row) => row.map((ok) => (ok ? RIGHT : WRONG)).join(""));
  return [header, ...rows, ...(url ? [url] : [])].join("\n");
}
