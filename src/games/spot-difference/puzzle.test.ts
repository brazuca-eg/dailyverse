import { describe, expect, it } from "vitest";
import { DIFFICULTIES } from "../../core/difficulty";
import { drawElement } from "./elements";
import { measureElement } from "./geometry";
import { generatePuzzle } from "./puzzle";
import { generateScene } from "./scene";

const SEEDS = Array.from({ length: 80 }, (_, seed) => seed);

describe("generatePuzzle", () => {
  it("makes a puzzle with five differences for every seed and tier", () => {
    DIFFICULTIES.forEach((tier) => {
      SEEDS.forEach((seed) => {
        const puzzle = generatePuzzle(seed, tier);
        expect(puzzle.differences).toHaveLength(5);
        expect(puzzle.seed).toBe(seed);
        expect(puzzle.tier).toBe(tier);
      });
    });
  });

  it("makes the same puzzle every time", () => {
    DIFFICULTIES.forEach((tier) => {
      expect(generatePuzzle(21, tier)).toEqual(generatePuzzle(21, tier));
    });
  });

  it("starts from the plain scene of the seed, whatever the tier", () => {
    DIFFICULTIES.forEach((tier) => {
      const puzzle = generatePuzzle(8, tier);
      const added = new Set(
        puzzle.differences
          .filter((difference) => difference.kind === "add")
          .map((difference) => difference.id),
      );
      expect(puzzle.original).toEqual({
        ...generateScene(8),
        elements: generateScene(8).elements.filter((element) => !added.has(element.id)),
      });
    });
  });

  it("makes different differences for different tiers", () => {
    const [easy, medium, hard] = DIFFICULTIES.map((tier) =>
      JSON.stringify(generatePuzzle(8, tier).altered),
    );
    expect(new Set([easy, medium, hard]).size).toBe(3);
  });

  it("makes different differences for different seeds", () => {
    const altered = SEEDS.map((seed) => JSON.stringify(generatePuzzle(seed, "medium").altered));
    expect(new Set(altered).size).toBe(SEEDS.length);
  });

  it("marks a changed shape by the part that changed, not the whole object", () => {
    const shapeChanges = SEEDS.flatMap((seed) => {
      const puzzle = generatePuzzle(seed, "medium");
      return puzzle.differences
        .filter((difference) => difference.kind === "revariant")
        .map((difference) => ({ puzzle, difference }));
    });
    expect(shapeChanges.length).toBeGreaterThan(20);
    const tighter = shapeChanges.filter(({ puzzle, difference }) => {
      const element = puzzle.original.elements.find((candidate) => candidate.id === difference.id);
      const bounds = element ? measureElement(element) : difference.region;
      const area = (bounds.right - bounds.left) * (bounds.bottom - bounds.top);
      const regionArea =
        (difference.region.right - difference.region.left) *
        (difference.region.bottom - difference.region.top);
      return regionArea < area;
    });
    expect(tighter.length).toBeGreaterThanOrEqual(shapeChanges.length / 4);
  });

  it("draws every altered element the same way as its plain version unless it was changed", () => {
    const puzzle = generatePuzzle(5, "hard");
    const changed = new Set(puzzle.differences.map((difference) => difference.id));
    puzzle.original.elements
      .filter((element) => !changed.has(element.id))
      .forEach((element) => {
        const twin = puzzle.altered.elements.find((candidate) => candidate.id === element.id);
        expect(twin && drawElement(twin)).toEqual(drawElement(element));
      });
  });
});
