import { DIFFICULTIES } from "../../core/difficulty";
import { decodePuzzle } from "./codec";
import type { SwitchbackData } from "./data";
import { areAdjacent } from "./grid";
import { countSolutions } from "./solver";
import { TIER_SETTINGS } from "./tiers";

export function verifySwitchbackData(data: SwitchbackData): string[] {
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
      const marksOk =
        puzzle.marks.length >= 2 &&
        new Set(puzzle.marks).size === puzzle.marks.length &&
        puzzle.marks.every((cell) => Number.isInteger(cell) && cell >= 0 && cell < cells);
      const wallsOk =
        stored.w.length % 2 === 0 &&
        puzzle.walls.every(
          ([first, second]) =>
            Number.isInteger(first) &&
            Number.isInteger(second) &&
            first >= 0 &&
            second < cells &&
            areAdjacent(settings.size, first, second),
        ) &&
        new Set(
          puzzle.walls.map(
            ([first, second]) => `${Math.min(first, second)}-${Math.max(first, second)}`,
          ),
        ).size === puzzle.walls.length;
      if (!marksOk || !wallsOk) {
        issues.push(`${where}: invalid checkpoints or fences`);
        return;
      }
      if (
        puzzle.marks.length < settings.minMarks ||
        puzzle.marks.length > settings.maxMarks ||
        puzzle.walls.length < settings.minWalls ||
        puzzle.walls.length > settings.maxWalls
      ) {
        issues.push(
          `${where}: ${puzzle.marks.length} checkpoints and ${puzzle.walls.length} fences do not fit the ${tier} rules`,
        );
      }
      if (countSolutions(puzzle, 2) !== 1) {
        issues.push(`${where}: does not have exactly one solution`);
      }
    });
  });
  return issues;
}
