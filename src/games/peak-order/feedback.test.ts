import { describe, expect, it } from "vitest";
import { checkOrder } from "./feedback";

describe("checkOrder", () => {
  it("marks every position that holds its own item", () => {
    expect(checkOrder([0, 2, 1, 3, 4]).correct).toEqual([true, false, false, true, true]);
  });

  it("is solved only when every position is right", () => {
    expect(checkOrder([0, 1, 2, 3, 4]).isSolved).toBe(true);
    expect(checkOrder([0, 1, 2, 4, 3]).isSolved).toBe(false);
    expect(checkOrder([1, 2, 3, 4, 0])).toEqual({
      correct: [false, false, false, false, false],
      isSolved: false,
    });
  });
});
