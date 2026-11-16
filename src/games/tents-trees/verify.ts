import { solveByLogic } from "./deduce";
import { TIER_SETTINGS } from "./difficulty";
import { isValidSolution } from "./rules";
import { solve } from "./solver";
import type { TentsRound } from "./types";

export function verifyRound(round: TentsRound): string[] {
  const { puzzle, tier } = round;
  const settings = TIER_SETTINGS[tier];
  const solutions = solve(puzzle, 2);
  const logic = solveByLogic(puzzle);
  const checks: [boolean, string][] = [
    [
      puzzle.size !== settings.size,
      `the grid is ${puzzle.size} wide but ${tier} puzzles are ${settings.size}`,
    ],
    [!isValidSolution(puzzle, puzzle.solution), "the stored solution breaks a rule"],
    [solutions.count !== 1, `there are ${solutions.count} solutions, not exactly one`],
    [
      solutions.count === 1 &&
        JSON.stringify(solutions.solutions[0]) !== JSON.stringify(puzzle.solution),
      "the only solution is not the stored one",
    ],
    [!logic.solved, "it cannot be solved by logic alone"],
    [
      logic.solved && logic.lookaheads < settings.minLookaheads,
      `it needs ${logic.lookaheads} lookaheads, fewer than ${settings.minLookaheads} for ${tier}`,
    ],
    [
      logic.solved && logic.lookaheads > settings.maxLookaheads,
      `it needs ${logic.lookaheads} lookaheads, more than ${settings.maxLookaheads} for ${tier}`,
    ],
  ];
  return checks.filter(([failed]) => failed).map(([, message]) => message);
}
