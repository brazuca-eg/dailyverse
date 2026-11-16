import { describe, expect, it, vi } from "vitest";

vi.mock("./puzzle", () => ({
  generatePuzzle: () => {
    throw new Error("Could not place the differences");
  },
}));

describe("findDailyPuzzle when a puzzle cannot be made", () => {
  it("finds nothing instead of throwing", async () => {
    const { findDailyPuzzle } = await import("./daily");
    expect(findDailyPuzzle(0)).toBeNull();
  });
});
