import { describe, expect, it } from "vitest";
import { verifyDays } from "./verify-days";

describe("verifyDays", () => {
  it("finds no problem in the first year of daily puzzles", () => {
    expect(verifyDays(0, 365)).toEqual([]);
  });

  it("checks days before the launch too", () => {
    expect(verifyDays(-30, 30)).toEqual([]);
  });

  it("reports nothing for zero days", () => {
    expect(verifyDays(0, 0)).toEqual([]);
  });
});
