import { describe, expect, it } from "vitest";
import { decodeGrid, encodeGrid } from "./codec";

describe("grid codec", () => {
  it("turns a grid into digits and back", () => {
    const grid = [0, 5, 3, 0, 0, 7, 0, 0, 0];
    expect(encodeGrid(grid)).toBe("053007000");
    expect(decodeGrid("053007000")).toEqual(grid);
    expect(decodeGrid(encodeGrid(grid))).toEqual(grid);
  });

  it("refuses text that is not digits", () => {
    expect(() => decodeGrid("12a4")).toThrow('"12a4" is not a grid of digits');
    expect(() => decodeGrid("")).toThrow();
    expect(() => decodeGrid("1 2")).toThrow();
  });
});
