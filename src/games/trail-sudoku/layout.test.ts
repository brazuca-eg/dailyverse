import { describe, expect, it } from "vitest";
import {
  LAYOUT_6,
  LAYOUT_9,
  buildPeers,
  buildUnits,
  countBits,
  findBox,
  fullMask,
  listDigits,
  toBit,
  toCell,
  toIndex,
} from "./layout";

describe.each([
  ["6x6", LAYOUT_6, 12],
  ["9x9", LAYOUT_9, 20],
])("%s layout", (_name, layout, peerCount) => {
  const cells = layout.size * layout.size;

  it("converts between an index and a row and column", () => {
    [0, 1, layout.size, cells - 1].forEach((index) => {
      expect(toIndex(layout, toCell(layout, index))).toBe(index);
    });
    expect(toCell(layout, layout.size + 2)).toEqual({ row: 1, col: 2 });
  });

  it("splits the grid into boxes that each hold one digit of every kind", () => {
    const sizes = Array.from(
      { length: layout.size },
      (_, box) =>
        Array.from({ length: cells }, (_, index) => findBox(layout, index)).filter(
          (found) => found === box,
        ).length,
    );
    expect(sizes.every((count) => count === layout.size)).toBe(true);
  });

  it("builds rows, columns and boxes of the right size, with every cell in three units", () => {
    const units = buildUnits(layout);
    expect(units).toHaveLength(layout.size * 3);
    units.forEach((unit) => expect(unit).toHaveLength(layout.size));
    Array.from({ length: cells }, (_, index) => index).forEach((index) => {
      expect(units.filter((unit) => unit.includes(index))).toHaveLength(3);
    });
  });

  it("gives every cell the same number of different peers, never itself", () => {
    buildPeers(layout).forEach((peers, index) => {
      expect(peers).toHaveLength(peerCount);
      expect(new Set(peers).size).toBe(peers.length);
      expect(peers).not.toContain(index);
    });
  });

  it("makes peers symmetric", () => {
    const peers = buildPeers(layout);
    peers.forEach((list, index) => list.forEach((peer) => expect(peers[peer]).toContain(index)));
  });

  it("has a full mask with one bit per digit", () => {
    expect(countBits(fullMask(layout))).toBe(layout.size);
  });
});

describe("the boxes", () => {
  it("are 2 rows by 3 columns in 6x6", () => {
    expect(findBox(LAYOUT_6, toIndex(LAYOUT_6, { row: 1, col: 2 }))).toBe(0);
    expect(findBox(LAYOUT_6, toIndex(LAYOUT_6, { row: 1, col: 3 }))).toBe(1);
    expect(findBox(LAYOUT_6, toIndex(LAYOUT_6, { row: 2, col: 0 }))).toBe(2);
    expect(findBox(LAYOUT_6, toIndex(LAYOUT_6, { row: 5, col: 5 }))).toBe(5);
  });

  it("are 3 by 3 in 9x9", () => {
    expect(findBox(LAYOUT_9, toIndex(LAYOUT_9, { row: 2, col: 2 }))).toBe(0);
    expect(findBox(LAYOUT_9, toIndex(LAYOUT_9, { row: 3, col: 0 }))).toBe(3);
    expect(findBox(LAYOUT_9, toIndex(LAYOUT_9, { row: 8, col: 8 }))).toBe(8);
  });
});

describe("digit masks", () => {
  it("maps digits to bits and back", () => {
    expect(toBit(1)).toBe(1);
    expect(toBit(4)).toBe(8);
    expect(listDigits(0b101001)).toEqual([1, 4, 6]);
    expect(listDigits(0)).toEqual([]);
    expect(countBits(0b101001)).toBe(3);
  });
});
