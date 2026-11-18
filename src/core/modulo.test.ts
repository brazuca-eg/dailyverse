import { describe, expect, it } from "vitest";
import { modulo } from "./modulo";

describe("modulo", () => {
  it("is the ordinary remainder for positive values", () => {
    expect(modulo(10, 7)).toBe(3);
    expect(modulo(7, 7)).toBe(0);
    expect(modulo(0, 7)).toBe(0);
  });

  it("stays between zero and the divisor for negative values", () => {
    expect(modulo(-1, 7)).toBe(6);
    expect(modulo(-7, 7)).toBe(0);
    expect(modulo(-8, 7)).toBe(6);
  });
});
