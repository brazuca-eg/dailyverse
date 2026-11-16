import { describe, expect, it } from "vitest";
import { isNonNegativeInteger, isOneOf, isRecord } from "./guards";

describe("isRecord", () => {
  it("accepts plain objects only", () => {
    expect(isRecord({})).toBe(true);
    expect(isRecord(null)).toBe(false);
    expect(isRecord([])).toBe(false);
    expect(isRecord("text")).toBe(false);
  });
});

describe("isNonNegativeInteger", () => {
  it("accepts whole numbers from zero up", () => {
    expect(isNonNegativeInteger(0)).toBe(true);
    expect(isNonNegativeInteger(12)).toBe(true);
  });

  it("rejects negatives, fractions and non-numbers", () => {
    expect(isNonNegativeInteger(-1)).toBe(false);
    expect(isNonNegativeInteger(1.5)).toBe(false);
    expect(isNonNegativeInteger("1")).toBe(false);
    expect(isNonNegativeInteger(Number.NaN)).toBe(false);
  });
});

describe("isOneOf", () => {
  const allowed = ["a", "b"] as const;

  it("accepts only listed strings", () => {
    expect(isOneOf(allowed, "a")).toBe(true);
    expect(isOneOf(allowed, "c")).toBe(false);
    expect(isOneOf(allowed, 1)).toBe(false);
    expect(isOneOf(allowed, undefined)).toBe(false);
  });
});
