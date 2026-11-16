import { describe, expect, it } from "vitest";
import { createRandom, hashSeed, shuffle } from "./random";

describe("createRandom", () => {
  it("gives the same sequence for the same seed", () => {
    const first = createRandom(7);
    const second = createRandom(7);
    expect([first(), first(), first()]).toEqual([second(), second(), second()]);
  });

  it("gives different sequences for different seeds", () => {
    expect(createRandom(1)()).not.toBe(createRandom(2)());
  });

  it("stays within zero and one", () => {
    const random = createRandom(42);
    Array.from({ length: 1000 }, () => random()).forEach((value) => {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    });
  });
});

describe("shuffle", () => {
  const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  it("keeps every item exactly once", () => {
    expect([...shuffle(items, createRandom(3))].sort((a, b) => a - b)).toEqual(items);
  });

  it("does not change the original list", () => {
    shuffle(items, createRandom(3));
    expect(items).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });

  it("gives the same order for the same seed and a different one for another seed", () => {
    expect(shuffle(items, createRandom(3))).toEqual(shuffle(items, createRandom(3)));
    expect(shuffle(items, createRandom(3))).not.toEqual(shuffle(items, createRandom(4)));
  });

  it("handles an empty list", () => {
    expect(shuffle([], createRandom(1))).toEqual([]);
  });
});

describe("hashSeed", () => {
  it("gives the same result for the same seed", () => {
    expect(hashSeed(5)).toBe(hashSeed(5));
  });

  it("spreads consecutive seeds far apart", () => {
    const hashes = Array.from({ length: 100 }, (_, seed) => hashSeed(seed));
    expect(new Set(hashes).size).toBe(100);
    const firstDigits = new Set(hashes.map((hash) => Math.floor((hash / 2 ** 32) * 4)));
    expect(firstDigits.size).toBe(4);
  });

  it("returns an unsigned 32-bit integer", () => {
    [0, 1, 2026, 2 ** 31, -7].forEach((seed) => {
      const hash = hashSeed(seed);
      expect(Number.isInteger(hash)).toBe(true);
      expect(hash).toBeGreaterThanOrEqual(0);
      expect(hash).toBeLessThan(2 ** 32);
    });
  });
});
