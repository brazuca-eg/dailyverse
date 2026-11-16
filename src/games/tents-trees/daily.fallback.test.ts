import { describe, expect, it, vi } from "vitest";

vi.mock("./generator", () => ({
  generateTentsPuzzle: () => {
    throw new Error("Could not make a tents puzzle");
  },
}));

describe("findDailyRound when a puzzle cannot be made", () => {
  it("finds nothing instead of throwing", async () => {
    const { findDailyRound } = await import("./daily");
    expect(findDailyRound(0)).toBeNull();
  });
});
