import { describe, expect, it } from "vitest";
import { listNeighbours, readNeighbours, toCol, toRow } from "./grid";

describe("toRow and toCol", () => {
  it("split an index into a row and a column", () => {
    expect(toRow(7, 0)).toBe(0);
    expect(toRow(7, 15)).toBe(2);
    expect(toCol(7, 15)).toBe(1);
    expect(toRow(7, 48)).toBe(6);
    expect(toCol(7, 48)).toBe(6);
  });
});

describe("listNeighbours", () => {
  it("lists all eight around a square in the middle, in reading order", () => {
    expect(listNeighbours(5, 12)).toEqual([6, 7, 8, 11, 13, 16, 17, 18]);
  });

  it("lists three in a corner and five on an edge", () => {
    expect(listNeighbours(5, 0)).toEqual([1, 5, 6]);
    expect(listNeighbours(5, 24)).toEqual([18, 19, 23]);
    expect(listNeighbours(5, 2)).toEqual([1, 3, 6, 7, 8]);
  });

  it("does not wrap from the end of a row to the next one", () => {
    expect(listNeighbours(5, 4)).not.toContain(5);
    expect(listNeighbours(5, 5)).not.toContain(4);
    expect(listNeighbours(5, 5)).not.toContain(9);
  });

  it("is symmetric: neighbours of a square have it as a neighbour", () => {
    readNeighbours(6).forEach((neighbours, index) => {
      neighbours.forEach((other) => expect(readNeighbours(6)[other]).toContain(index));
    });
  });
});

describe("readNeighbours", () => {
  it("gives the same list for the same size, and one entry per square", () => {
    expect(readNeighbours(7)).toBe(readNeighbours(7));
    expect(readNeighbours(7)).toHaveLength(49);
    expect(readNeighbours(5)).not.toBe(readNeighbours(7));
  });
});
