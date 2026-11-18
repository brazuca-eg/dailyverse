import { describe, expect, it } from "vitest";
import { CATEGORY_IDS } from "./categories";
import { buildPrompt, formatValue } from "./format";

describe("formatValue", () => {
  it("shows thousands separators and the unit of the category", () => {
    expect(formatValue(4807, "mountains")).toBe("4,807 m");
    expect(formatValue(6650, "rivers")).toBe("6,650 km");
    expect(formatValue(386400, "lakes")).toBe("386,400 km²");
    expect(formatValue(2166086, "islands")).toBe("2,166,086 km²");
    expect(formatValue(5895, "volcanoes")).toBe("5,895 m");
  });

  it("does not add a separator to a small number", () => {
    expect(formatValue(999, "mountains")).toBe("999 m");
    expect(formatValue(0, "mountains")).toBe("0 m");
  });
});

describe("buildPrompt", () => {
  it("says what to order and in which direction", () => {
    expect(buildPrompt("mountains")).toBe("Order these mountains from lowest to highest");
    expect(buildPrompt("rivers")).toBe("Order these rivers from shortest to longest");
    expect(buildPrompt("lakes")).toBe("Order these lakes from smallest to largest");
  });

  it("has a different prompt for each category", () => {
    expect(new Set(CATEGORY_IDS.map(buildPrompt)).size).toBe(5);
  });
});
