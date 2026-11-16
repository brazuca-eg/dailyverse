import { describe, expect, it } from "vitest";
import { buildDailyRound } from "./daily";
import { generateTentsPuzzle } from "./generator";
import { verifyRound } from "./verify";
import type { TentsRound } from "./types";

const DAYS = Array.from({ length: 45 }, (_, day) => day);

describe("verifyRound", () => {
  it("finds nothing wrong with the daily puzzles", () => {
    const failures = DAYS.flatMap((day) => {
      const issues = verifyRound(buildDailyRound(day));
      return issues.length > 0 ? [`day ${day}: ${issues.join("; ")}`] : [];
    });
    expect(failures).toEqual([]);
  });

  it("reports a puzzle with more than one solution, and that logic cannot solve it", () => {
    const ambiguous: TentsRound = {
      seed: 1,
      tier: "easy",
      puzzle: {
        size: 3,
        trees: [
          { row: 1, col: 0 },
          { row: 1, col: 2 },
        ],
        rowCounts: [1, 0, 1],
        colCounts: [1, 0, 1],
        solution: [
          { row: 0, col: 0 },
          { row: 2, col: 2 },
        ],
      },
    };
    const issues = verifyRound(ambiguous);
    expect(issues).toContain("there are 2 solutions, not exactly one");
    expect(issues).toContain("it cannot be solved by logic alone");
    expect(issues.some((issue) => issue.includes("3 wide"))).toBe(true);
  });

  it("reports a stored solution that breaks a rule or is not the real one", () => {
    const real = buildDailyRound(0);
    const swapped = {
      ...real,
      puzzle: { ...real.puzzle, solution: [...real.puzzle.solution].reverse() },
    };
    expect(verifyRound(swapped)).toContain("the only solution is not the stored one");
    const broken = { ...real, puzzle: { ...real.puzzle, solution: real.puzzle.solution.slice(1) } };
    expect(verifyRound(broken)).toContain("the stored solution breaks a rule");
  });

  it("reports a puzzle that is too easy or too hard for its tier", () => {
    const easyPuzzle = generateTentsPuzzle(1, "easy");
    const hardPuzzle = generateTentsPuzzle(1, "hard");
    const tooHard = verifyRound({ seed: 1, tier: "easy", puzzle: hardPuzzle });
    expect(tooHard.some((issue) => issue.includes("more than"))).toBe(true);
    expect(tooHard.some((issue) => issue.includes("10 wide"))).toBe(true);
    const tooEasy = verifyRound({ seed: 1, tier: "hard", puzzle: easyPuzzle });
    expect(tooEasy.some((issue) => issue.includes("fewer than"))).toBe(true);
  });
});
