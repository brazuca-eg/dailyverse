import { describe, expect, it } from "vitest";
import { areAdjacent, listNeighbours, toCol, toEdgeKey, toRow } from "./grid";

describe("toRow and toCol", () => {
  it("split an index into a row and a column", () => {
    expect(toRow(5, 0)).toBe(0);
    expect(toRow(5, 7)).toBe(1);
    expect(toCol(5, 7)).toBe(2);
    expect(toRow(5, 24)).toBe(4);
    expect(toCol(5, 24)).toBe(4);
  });
});

describe("listNeighbours", () => {
  it("lists four neighbours in the middle, in a fixed order", () => {
    expect(listNeighbours(5, 12)).toEqual([7, 13, 17, 11]);
  });

  it("lists two in a corner and three on an edge", () => {
    expect(listNeighbours(5, 0)).toEqual([1, 5]);
    expect(listNeighbours(5, 24)).toEqual([19, 23]);
    expect(listNeighbours(5, 2)).toEqual([3, 7, 1]);
  });

  it("does not wrap from the end of a row to the next one", () => {
    expect(listNeighbours(5, 4)).not.toContain(5);
    expect(listNeighbours(5, 5)).not.toContain(4);
  });
});

describe("areAdjacent", () => {
  it("is true for squares that touch along a side, in both directions", () => {
    expect(areAdjacent(5, 6, 7)).toBe(true);
    expect(areAdjacent(5, 7, 6)).toBe(true);
    expect(areAdjacent(5, 6, 11)).toBe(true);
  });

  it("is false for diagonals, distant squares, the same square and the wrap-around", () => {
    expect(areAdjacent(5, 6, 12)).toBe(false);
    expect(areAdjacent(5, 0, 2)).toBe(false);
    expect(areAdjacent(5, 6, 6)).toBe(false);
    expect(areAdjacent(5, 4, 5)).toBe(false);
  });
});

describe("toEdgeKey", () => {
  it("is the same whichever way round the squares are given", () => {
    expect(toEdgeKey(3, 8)).toBe("3-8");
    expect(toEdgeKey(8, 3)).toBe("3-8");
  });
});
