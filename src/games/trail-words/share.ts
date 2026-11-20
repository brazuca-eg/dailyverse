import { gameMeta } from "./meta";
import { t } from "./messages";
import { findRankProgress, readRankLabel } from "./ranks";
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
    `Dailyverse ${gameMeta("meta.words.title")} #${puzzleNumber}`,
    readRankLabel(rank),
    t("words.share.words", { found: commonFound, total: puzzle.common.size }),
  ];
  if (state.found.some((word) => puzzle.pangrams.includes(word))) {
    parts.push(t("words.share.pangram"));
  }
  const lines = [parts.join(" · ")];
  if (url) {
    lines.push(url);
  }
  return lines.join("\n");
}
