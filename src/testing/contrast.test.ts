import { describe, expect, it } from "vitest";
import { calculateContrast } from "./contrast";

describe("calculateContrast", () => {
  it("gives 21 for black on white and 1 for the same colour", () => {
    expect(calculateContrast("#000000", "#ffffff")).toBeCloseTo(21, 5);
    expect(calculateContrast("#336699", "#336699")).toBe(1);
  });

  it("does not depend on which colour is first", () => {
    expect(calculateContrast("#1b5e3a", "#fbf6ec")).toBe(calculateContrast("#fbf6ec", "#1b5e3a"));
  });

  it("matches a known value", () => {
    expect(calculateContrast("#777777", "#ffffff")).toBeCloseTo(4.48, 2);
  });
});
