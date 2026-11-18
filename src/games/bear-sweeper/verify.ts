import { DIFFICULTIES } from "../../core/difficulty";
import { listStartCells } from "./counts";
import { decodePuzzle } from "./codec";
import type { BearData } from "./data";
import { solveByLogic } from "./logic";
import { readNeighbours } from "./grid";
import { TIER_SETTINGS } from "./tiers";

export function verifyBearData(data: BearData): string[] {
  const issues: string[] = [];
  DIFFICULTIES.forEach((tier) => {
    const settings = TIER_SETTINGS[tier];
    const cells = settings.size * settings.size;
    const pool = data[tier];
    if (pool.length < settings.poolSize) {
      issues.push(`${tier}: only ${pool.length} puzzles, need ${settings.poolSize}`);
    }
    const seen = new Set<string>();
    pool.forEach((stored, index) => {
      const where = `${tier} #${index}`;
      const key = JSON.stringify(stored);
      if (seen.has(key)) {
        issues.push(`${where}: duplicate puzzle`);
      }
      seen.add(key);
      const puzzle = decodePuzzle(settings.size, stored);
      const isShapeOk =
        puzzle.bears.length === settings.bears &&
        new Set(puzzle.bears).size === puzzle.bears.length &&
        puzzle.bears.every((cell) => Number.isInteger(cell) && cell >= 0 && cell < cells) &&
        Number.isInteger(puzzle.start) &&
        puzzle.start >= 0 &&
        puzzle.start < cells;
      if (!isShapeOk) {
        issues.push(`${where}: invalid bears or start`);
        return;
      }
      const safeStart = ![puzzle.start, ...readNeighbours(settings.size)[puzzle.start]].some(
        (cell) => puzzle.bears.includes(cell),
      );
      if (!safeStart) {
        issues.push(`${where}: a bear is next to the starting clearing`);
        return;
      }
      if (listStartCells(puzzle).length / (cells - settings.bears) > settings.maxOpenShare) {
        issues.push(`${where}: the starting clearing opens too much`);
      }
      const result = solveByLogic(puzzle, settings.maxLevel);
      if (!result.solved || result.mistakes > 0) {
        issues.push(`${where}: cannot be solved without guessing`);
      } else if (result.hardest < settings.minLevel || result.hardest > settings.maxLevel) {
        issues.push(`${where}: does not fit the ${tier} rules (hardest step ${result.hardest})`);
      }
    });
  });
  return issues;
}
