import { describe, expect, it } from "vitest";
import { DIFFICULTIES, type Difficulty } from "../../src/core/difficulty";
import { generatePuzzle } from "../../src/games/spot-difference/puzzle";
import type { Puzzle } from "../../src/games/spot-difference/types";
import { MIN_CHANGED_PIXELS, verifyPuzzle } from "./verify";

const SEEDS = Array.from({ length: 25 }, (_, seed) => seed);
const RASTER_TIMEOUT = 120000;
const REGRESSIONS: readonly (readonly [Difficulty, number])[] = [
  ["easy", 16],
  ["easy", 30],
  ["easy", 168],
  ["easy", 182],
  ["easy", 267],
  ["medium", 267],
  ["hard", 3],
  ["hard", 124],
  ["hard", 139],
];

describe("verifyPuzzle", () => {
  it(
    "passes every generated puzzle: each difference is visible and nothing else changed",
    () => {
      const failures = DIFFICULTIES.flatMap((tier) =>
        SEEDS.flatMap((seed) => {
          const issues = verifyPuzzle(generatePuzzle(seed, tier));
          return issues.length > 0 ? [`${tier} ${seed}: ${issues.join("; ")}`] : [];
        }),
      );
      expect(failures).toEqual([]);
    },
    RASTER_TIMEOUT,
  );

  it(
    "passes the seeds that once produced invisible or tiny differences",
    () => {
      const failures = REGRESSIONS.flatMap(([tier, seed]) => {
        const issues = verifyPuzzle(generatePuzzle(seed, tier));
        return issues.length > 0 ? [`${tier} ${seed}: ${issues.join("; ")}`] : [];
      });
      expect(failures).toEqual([]);
    },
    RASTER_TIMEOUT,
  );

  it("reports a difference that changes nothing you can see", () => {
    const puzzle = generatePuzzle(3, "hard");
    const [first] = puzzle.differences;
    const unchanged: Puzzle = {
      ...puzzle,
      altered: {
        ...puzzle.altered,
        elements: [
          ...puzzle.altered.elements.filter((element) => element.id !== first.id),
          ...puzzle.original.elements.filter((element) => element.id === first.id),
        ].sort((a, b) => puzzle.original.elements.indexOf(a) - puzzle.original.elements.indexOf(b)),
      },
    };
    const issues = verifyPuzzle(unchanged);
    expect(
      issues.some((issue) => issue.startsWith(`${first.id} `) && issue.includes("changes only")),
    ).toBe(true);
  });

  it("reports a change that is not one of the listed differences", () => {
    const puzzle = generatePuzzle(3, "hard");
    const listed = new Set(puzzle.differences.map((difference) => difference.id));
    const stray = puzzle.altered.elements.find(
      (element) => element.kind === "pine" && !listed.has(element.id),
    );
    expect(stray).toBeDefined();
    const tampered: Puzzle = {
      ...puzzle,
      altered: {
        ...puzzle.altered,
        elements: puzzle.altered.elements.filter((element) => element.id !== stray?.id),
      },
    };
    const issues = verifyPuzzle(tampered);
    expect(issues.some((issue) => issue.includes("lie outside every difference"))).toBe(true);
  });

  it("passes only when the minimum number of changed pixels is met", () => {
    expect(MIN_CHANGED_PIXELS).toBeGreaterThan(10);
  });
});
