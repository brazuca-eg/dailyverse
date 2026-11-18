import { describe, expect, it } from "vitest";
import { selectPool, type Candidate } from "./pool";

const candidates: Candidate[] = Array.from({ length: 60 }, (_, index) => ({
  letterMask: 100 + Math.floor(index / 3),
  centreBit: index % 3,
}));

describe("selectPool", () => {
  it("takes at most the size asked for", () => {
    expect(selectPool(candidates, 10, 3)).toHaveLength(10);
    expect(selectPool(candidates, 500, 3)).toHaveLength(60);
  });

  it("takes at most the limit from one letter set", () => {
    const pool = selectPool(candidates, 60, 2);
    const perSet = new Map<number, number>();
    pool.forEach((pick) => perSet.set(pick.letterMask, (perSet.get(pick.letterMask) ?? 0) + 1));
    expect(Math.max(...perSet.values())).toBe(2);
    expect(pool).toHaveLength(40);
  });

  it("makes the same choice every time, whatever order the candidates come in", () => {
    const forward = selectPool(candidates, 15, 2);
    const backward = selectPool([...candidates].reverse(), 15, 2);
    expect(backward).toEqual(forward);
  });

  it("does not simply take the first ones", () => {
    const pool = selectPool(candidates, 10, 3);
    expect(pool).not.toEqual(candidates.slice(0, 10));
  });

  it("never picks the same puzzle twice", () => {
    const keys = selectPool(candidates, 60, 3).map(
      (pick) => `${pick.letterMask}:${pick.centreBit}`,
    );
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("gives nothing for no candidates or a size of zero", () => {
    expect(selectPool([], 10, 2)).toEqual([]);
    expect(selectPool(candidates, 0, 2)).toEqual([]);
  });

  it("does not change the list it is given", () => {
    const copy = [...candidates];
    selectPool(candidates, 10, 2);
    expect(candidates).toEqual(copy);
  });
});
