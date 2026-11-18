import { describe, expect, it } from "vitest";
import { createRandom } from "../../core/random";
import { isHamiltonianPath, randomHamiltonianPath } from "./pathgen";

describe("randomHamiltonianPath", () => {
  it.each([3, 4, 5, 6, 7])("makes a path through every square of a %sx%s grid", (size) => {
    Array.from({ length: 30 }, (_, seed) => seed).forEach((seed) => {
      expect(isHamiltonianPath(size, randomHamiltonianPath(size, createRandom(seed)))).toBe(true);
    });
  });

  it("is the same for the same seed, and varies between seeds", () => {
    const first = randomHamiltonianPath(6, createRandom(3));
    expect(randomHamiltonianPath(6, createRandom(3))).toEqual(first);
    const paths = Array.from({ length: 30 }, (_, seed) =>
      randomHamiltonianPath(6, createRandom(seed)).join(),
    );
    expect(new Set(paths).size).toBeGreaterThan(25);
  });

  it("starts in different places, not always in the same corner", () => {
    const starts = Array.from(
      { length: 60 },
      (_, seed) => randomHamiltonianPath(6, createRandom(seed))[0],
    );
    expect(new Set(starts).size).toBeGreaterThan(5);
  });

  it("is not just the serpentine it starts from", () => {
    const serpentine = Array.from({ length: 36 }, (_, step) => {
      const row = Math.floor(step / 6);
      const offset = step % 6;
      return row * 6 + (row % 2 === 0 ? offset : 5 - offset);
    });
    expect(randomHamiltonianPath(6, createRandom(1))).not.toEqual(serpentine);
  });
});

describe("isHamiltonianPath", () => {
  const good = [0, 1, 2, 5, 4, 3, 6, 7, 8];

  it("accepts a path that covers every square once", () => {
    expect(isHamiltonianPath(3, good)).toBe(true);
  });

  it("rejects a path that is too short, repeats a square or jumps", () => {
    expect(isHamiltonianPath(3, good.slice(0, 8))).toBe(false);
    expect(isHamiltonianPath(3, [0, 1, 2, 5, 4, 3, 6, 7, 7])).toBe(false);
    expect(isHamiltonianPath(3, [0, 1, 2, 5, 4, 3, 6, 8, 7])).toBe(false);
    expect(isHamiltonianPath(3, [0, 4, 2, 5, 1, 3, 6, 7, 8])).toBe(false);
  });

  it("rejects squares that are off the grid", () => {
    expect(isHamiltonianPath(3, [0, 1, 2, 5, 4, 3, 6, 7, 9])).toBe(false);
    expect(isHamiltonianPath(3, [-1, 1, 2, 5, 4, 3, 6, 7, 8])).toBe(false);
  });
});
