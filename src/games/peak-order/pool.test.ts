import { describe, expect, it } from "vitest";
import { buildPool, findMinEditions, listCandidates, MAX_ITEM_USES } from "./pool";
import { fitsTier, TIER_RULES } from "./tiers";
import { makeItems } from "./testing";

const items = makeItems(300);

describe("listCandidates", () => {
  it("keeps the best known items, in order of value", () => {
    const candidates = listCandidates(items, "medium");
    expect(candidates).toHaveLength(TIER_RULES.medium.candidateCount);
    expect(candidates.map((item) => item.editions)).toEqual(
      [...candidates.map((item) => item.editions)].sort((a, b) => b - a),
    );
    expect(Math.min(...candidates.map((item) => item.editions))).toBe(300 - 99);
    expect(candidates.map((item) => item.value)).toEqual(
      [...candidates.map((item) => item.value)].sort((a, b) => a - b),
    );
  });

  it("takes more items for hard days", () => {
    expect(listCandidates(items, "hard")).toHaveLength(TIER_RULES.hard.candidateCount);
  });

  it("breaks ties by name, so the choice does not depend on the input order", () => {
    const tied = makeItems(150).map((item) => ({ ...item, editions: 50 }));
    const first = listCandidates(tied, "medium").map((item) => item.name);
    const second = listCandidates([...tied].reverse(), "medium").map((item) => item.name);
    expect(second).toEqual(first);
  });

  it("does not change the list it is given", () => {
    const copy = items.map((item) => ({ ...item }));
    listCandidates(copy, "medium");
    expect(copy).toEqual(items);
  });
});

describe("findMinEditions", () => {
  it("is the editions of the least known candidate", () => {
    expect(findMinEditions(items, "medium")).toBe(201);
    expect(findMinEditions(items, "hard")).toBe(51);
  });
});

describe("buildPool", () => {
  it.each(["medium", "hard"] as const)(
    "builds the wanted number of %s puzzles that fit the rules",
    (tier) => {
      const pool = buildPool(items, tier, "mountains", 30);
      const minEditions = findMinEditions(items, tier);
      expect(pool).toHaveLength(30);
      pool.forEach((set) => expect(fitsTier(set, tier, minEditions)).toBe(true));
    },
  );

  it("never repeats a puzzle, and no item more than the limit", () => {
    const pool = buildPool(items, "medium", "mountains", 60);
    expect(new Set(pool.map((set) => set.map((item) => item.name).join("|"))).size).toBe(60);
    const uses = new Map<string, number>();
    pool.flat().forEach((item) => uses.set(item.name, (uses.get(item.name) ?? 0) + 1));
    expect(Math.max(...uses.values())).toBeLessThanOrEqual(MAX_ITEM_USES);
  });

  it("gives hard puzzles a close pair", () => {
    buildPool(items, "hard", "rivers", 20).forEach((set) => {
      const ratios = set.slice(1).map((item, index) => item.value / set[index].value);
      const closest = Math.min(...ratios);
      expect(closest).toBeGreaterThanOrEqual(1.03);
      expect(closest).toBeLessThanOrEqual(1.08);
    });
  });

  it("gives the same pool every time, and a different one for another category or tier", () => {
    const first = buildPool(items, "medium", "mountains", 10);
    expect(buildPool(items, "medium", "mountains", 10)).toEqual(first);
    expect(buildPool(items, "medium", "rivers", 10)).not.toEqual(first);
    expect(buildPool(items, "hard", "mountains", 10)).not.toEqual(first);
  });

  it("never repeats a puzzle even when there are few possible ones", () => {
    const pool = buildPool(makeItems(7, 1.2), "medium", "mountains", 10);
    expect(new Set(pool.map((set) => set.map((item) => item.name).join("|"))).size).toBe(10);
  });

  it("stops with an error when the data cannot give enough puzzles", () => {
    expect(() => buildPool(makeItems(8), "medium", "mountains", 50)).toThrow(
      /Only \d+ of 50 medium mountains/,
    );
    expect(() => buildPool(makeItems(300, 1.001), "medium", "mountains", 5)).toThrow();
  });

  it("stops straight away when there are fewer items than a puzzle needs", () => {
    expect(() => buildPool([], "medium", "lakes", 5)).toThrow("Only 0 medium lakes items, need 5");
    expect(() => buildPool(makeItems(4), "hard", "lakes", 5)).toThrow(
      "Only 4 hard lakes items, need 5",
    );
  });

  it("uses the default size for the tier", () => {
    expect(buildPool(items, "hard", "lakes")).toHaveLength(TIER_RULES.hard.poolSize);
  });
});
