import { findRankProgress } from "./ranks";
import { calculateScore, type TrailState } from "./game";
import type { TrailPuzzle } from "./puzzle";

export function buildShareText(
  puzzle: TrailPuzzle,
  state: TrailState,
  puzzleNumber: number,
  url?: string,
): string {
  const rank = findRankProgress(calculateScore(puzzle, state.found), puzzle.maxScore).rank;
  const commonFound = state.found.filter((word) => puzzle.common.has(word)).length;
  const parts = [
    `Dailyverse Trail Words #${puzzleNumber}`,
    rank,
    `${commonFound}/${puzzle.common.size} words`,
  ];
  if (state.found.some((word) => puzzle.pangrams.includes(word))) {
    parts.push("pangram found");
  }
  const lines = [parts.join(" · ")];
  if (url) {
    lines.push(url);
  }
  return lines.join("\n");
}
