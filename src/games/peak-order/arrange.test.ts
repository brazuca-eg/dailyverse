import { describe, expect, it } from "vitest";
import { createRandom } from "../../core/random";
import { countFixedPoints, createStartOrder, moveItem } from "./arrange";

describe("countFixedPoints", () => {
  it("counts the items already in their own position", () => {
    expect(countFixedPoints([0, 1, 2, 3, 4])).toBe(5);
    expect(countFixedPoints([1, 0, 2, 4, 3])).toBe(1);
    expect(countFixedPoints([1, 2, 3, 4, 0])).toBe(0);
    expect(countFixedPoints([])).toBe(0);
  });
});

describe("createStartOrder", () => {
  const orders = Array.from({ length: 500 }, (_, seed) => createStartOrder(5, createRandom(seed)));

  it("uses every item once", () => {
    orders.forEach((order) => expect([...order].sort()).toEqual([0, 1, 2, 3, 4]));
  });

  it("is never solved and gives away at most one position", () => {
    orders.forEach((order) => expect(countFixedPoints(order)).toBeLessThanOrEqual(1));
  });

  it("is sometimes one position right, so the start is not always a full derangement", () => {
    expect(orders.some((order) => countFixedPoints(order) === 1)).toBe(true);
    expect(orders.some((order) => countFixedPoints(order) === 0)).toBe(true);
  });

  it("is the same for the same seed and varies between seeds", () => {
    expect(createStartOrder(5, createRandom(7))).toEqual(createStartOrder(5, createRandom(7)));
    expect(new Set(orders.map((order) => order.join(""))).size).toBeGreaterThan(20);
  });

  it("falls back to a shifted order when the random numbers never give a good one", () => {
    expect(createStartOrder(5, () => 0.999999)).toEqual([1, 2, 3, 4, 0]);
    expect(createStartOrder(5, () => 0)).toEqual([1, 2, 3, 4, 0]);
  });
});

describe("moveItem", () => {
  const order = [10, 11, 12, 13, 14];

  it("moves an item later, shifting the ones in between up", () => {
    expect(moveItem(order, 1, 3)).toEqual([10, 12, 13, 11, 14]);
  });

  it("moves an item earlier, shifting the ones in between down", () => {
    expect(moveItem(order, 3, 1)).toEqual([10, 13, 11, 12, 14]);
  });

  it("moves to either end", () => {
    expect(moveItem(order, 0, 4)).toEqual([11, 12, 13, 14, 10]);
    expect(moveItem(order, 4, 0)).toEqual([14, 10, 11, 12, 13]);
  });

  it("changes nothing when an item stays where it is", () => {
    expect(moveItem(order, 2, 2)).toEqual(order);
  });

  it("swaps neighbours", () => {
    expect(moveItem(order, 2, 3)).toEqual([10, 11, 13, 12, 14]);
    expect(moveItem(order, 3, 2)).toEqual([10, 11, 13, 12, 14]);
  });

  it("does not change the list it is given", () => {
    const copy = [...order];
    moveItem(copy, 0, 4);
    expect(copy).toEqual(order);
  });

  it("refuses positions that do not exist", () => {
    expect(() => moveItem(order, -1, 2)).toThrow();
    expect(() => moveItem(order, 2, -1)).toThrow();
    expect(() => moveItem(order, 5, 2)).toThrow();
    expect(() => moveItem(order, 2, 5)).toThrow();
    expect(() => moveItem(order, 1.5, 2)).toThrow();
  });
});
