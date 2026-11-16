import { describe, expect, it } from "vitest";
import {
  isInside,
  isValidSolution,
  listAllNeighbours,
  listOrthogonalNeighbours,
  sortCells,
  toCell,
  toIndex,
} from "./rules";
import type { TentsClues } from "./types";

const twoTreesApart: TentsClues = {
  size: 3,
  trees: [
    { row: 1, col: 0 },
    { row: 1, col: 2 },
  ],
  rowCounts: [1, 0, 1],
  colCounts: [1, 0, 1],
};

describe("cell helpers", () => {
  it("converts between a cell and its index", () => {
    expect(toIndex(5, { row: 2, col: 3 })).toBe(13);
    expect(toCell(5, 13)).toEqual({ row: 2, col: 3 });
    expect(toCell(4, toIndex(4, { row: 3, col: 0 }))).toEqual({ row: 3, col: 0 });
  });

  it("knows what is inside the grid", () => {
    expect(isInside(4, { row: 0, col: 3 })).toBe(true);
    expect(isInside(4, { row: 4, col: 0 })).toBe(false);
    expect(isInside(4, { row: 0, col: -1 })).toBe(false);
  });

  it("sorts cells row by row without changing the original", () => {
    const cells = [
      { row: 2, col: 0 },
      { row: 0, col: 3 },
      { row: 0, col: 1 },
    ];
    expect(sortCells(cells)).toEqual([
      { row: 0, col: 1 },
      { row: 0, col: 3 },
      { row: 2, col: 0 },
    ]);
    expect(cells[0]).toEqual({ row: 2, col: 0 });
  });
});

describe("neighbours", () => {
  it("lists the four cells up, down, left and right", () => {
    expect(listOrthogonalNeighbours(5, { row: 2, col: 2 })).toHaveLength(4);
  });

  it("lists all eight cells around one, and fewer at the edge and corner", () => {
    expect(listAllNeighbours(5, { row: 2, col: 2 })).toHaveLength(8);
    expect(listAllNeighbours(5, { row: 0, col: 2 })).toHaveLength(5);
    expect(listAllNeighbours(5, { row: 0, col: 0 })).toHaveLength(3);
    expect(listOrthogonalNeighbours(5, { row: 0, col: 0 })).toHaveLength(2);
  });

  it("never includes the cell itself", () => {
    expect(listAllNeighbours(5, { row: 2, col: 2 })).not.toContainEqual({ row: 2, col: 2 });
  });
});

describe("isValidSolution", () => {
  const first = [
    { row: 0, col: 0 },
    { row: 2, col: 2 },
  ];

  it("accepts a layout that follows every rule", () => {
    expect(isValidSolution(twoTreesApart, first)).toBe(true);
    expect(
      isValidSolution(twoTreesApart, [
        { row: 0, col: 2 },
        { row: 2, col: 0 },
      ]),
    ).toBe(true);
  });

  it("rejects the wrong number of tents", () => {
    expect(isValidSolution(twoTreesApart, [first[0]])).toBe(false);
    expect(isValidSolution(twoTreesApart, [...first, { row: 1, col: 1 }])).toBe(false);
  });

  it("rejects row or column counts that do not match", () => {
    expect(
      isValidSolution(twoTreesApart, [
        { row: 0, col: 0 },
        { row: 1, col: 1 },
      ]),
    ).toBe(false);
  });

  it("rejects a tent on a tree, outside the grid or on the same cell twice", () => {
    expect(isValidSolution(twoTreesApart, [{ row: 1, col: 0 }, first[1]])).toBe(false);
    expect(isValidSolution(twoTreesApart, [{ row: -1, col: 0 }, first[1]])).toBe(false);
    expect(isValidSolution(twoTreesApart, [first[0], first[0]])).toBe(false);
  });

  it("rejects two tents that touch, side by side or at a corner", () => {
    const sideBySide: TentsClues = {
      size: 3,
      trees: [
        { row: 0, col: 0 },
        { row: 1, col: 2 },
      ],
      rowCounts: [1, 1, 0],
      colCounts: [0, 2, 0],
    };
    expect(
      isValidSolution(sideBySide, [
        { row: 0, col: 1 },
        { row: 1, col: 1 },
      ]),
    ).toBe(false);
    const corner: TentsClues = {
      size: 3,
      trees: [
        { row: 0, col: 0 },
        { row: 2, col: 2 },
      ],
      rowCounts: [1, 1, 0],
      colCounts: [0, 1, 1],
    };
    expect(
      isValidSolution(corner, [
        { row: 0, col: 1 },
        { row: 1, col: 2 },
      ]),
    ).toBe(false);
  });

  it("rejects tents that cannot each have their own tree", () => {
    const sharedTree: TentsClues = {
      size: 4,
      trees: [
        { row: 1, col: 1 },
        { row: 3, col: 3 },
      ],
      rowCounts: [1, 0, 1, 0],
      colCounts: [0, 2, 0, 0],
    };
    expect(
      isValidSolution(sharedTree, [
        { row: 0, col: 1 },
        { row: 2, col: 1 },
      ]),
    ).toBe(false);
  });

  it("accepts a tent between two trees when each tree still gets its own tent", () => {
    const clues: TentsClues = {
      size: 3,
      trees: [
        { row: 0, col: 0 },
        { row: 1, col: 1 },
      ],
      rowCounts: [1, 0, 1],
      colCounts: [0, 2, 0],
    };
    expect(
      isValidSolution(clues, [
        { row: 0, col: 1 },
        { row: 2, col: 1 },
      ]),
    ).toBe(true);
  });

  it("rejects a tent that is next to no tree at all", () => {
    const clues: TentsClues = {
      size: 3,
      trees: [
        { row: 0, col: 0 },
        { row: 1, col: 1 },
      ],
      rowCounts: [1, 0, 1],
      colCounts: [0, 1, 1],
    };
    expect(
      isValidSolution(clues, [
        { row: 0, col: 1 },
        { row: 2, col: 2 },
      ]),
    ).toBe(false);
  });
});
