import { DIFFICULTIES } from "../../core/difficulty";
import { decodeGrid } from "./codec";
import type { SudokuData } from "./data";
import { solveByLogic } from "./logic";
import { countSolutions } from "./solver";
import { TIER_SETTINGS } from "./tiers";

export function verifySudokuData(data: SudokuData): string[] {
  const issues: string[] = [];
  DIFFICULTIES.forEach((tier) => {
    const { layout, minHardest, maxHardest, minClues, poolSize } = TIER_SETTINGS[tier];
    const pool = data[tier];
    if (pool.length < poolSize) {
      issues.push(`${tier}: only ${pool.length} puzzles, need ${poolSize}`);
    }
    const seen = new Set<string>();
    pool.forEach((text, index) => {
      const where = `${tier} #${index}`;
      if (seen.has(text)) {
        issues.push(`${where}: duplicate puzzle`);
      }
      seen.add(text);
      const isShapeOk = text.length === layout.size * layout.size && /^[0-9]+$/.test(text);
      const grid = isShapeOk ? decodeGrid(text) : [];
      if (!isShapeOk || grid.some((digit) => digit > layout.size)) {
        issues.push(`${where}: not a ${layout.size}x${layout.size} grid`);
        return;
      }
      if (grid.filter((digit) => digit !== 0).length < minClues) {
        issues.push(`${where}: fewer than ${minClues} clues`);
      }
      if (countSolutions(layout, grid, 2) !== 1) {
        issues.push(`${where}: does not have exactly one solution`);
      }
      const graded = solveByLogic(layout, grid, maxHardest);
      if (!graded.solved || graded.hardest < minHardest || graded.hardest > maxHardest) {
        issues.push(`${where}: does not fit the ${tier} rules (hardest step ${graded.hardest})`);
      }
    });
  });
  return issues;
}
