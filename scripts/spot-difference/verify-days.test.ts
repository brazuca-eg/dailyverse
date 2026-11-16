import { describe, expect, it } from "vitest";
import { verifyDays } from "./verify-days";

describe("verifyDays", () => {
  it("finds no problem in the first two months of daily puzzles", () => {
    expect(verifyDays(0, 60)).toEqual([]);
  }, 120000);

  it("reports nothing for zero days", () => {
    expect(verifyDays(0, 0)).toEqual([]);
  });

  it("checks days before the launch too", () => {
    expect(verifyDays(-10, 10)).toEqual([]);
  }, 120000);
});
