import { describe, expect, it } from "vitest";
import { formatElapsed, pluralise } from "./elapsed";

describe("formatElapsed", () => {
  it("shows minutes and two-digit seconds", () => {
    expect(formatElapsed(0)).toBe("0:00");
    expect(formatElapsed(9)).toBe("0:09");
    expect(formatElapsed(65)).toBe("1:05");
    expect(formatElapsed(600)).toBe("10:00");
    expect(formatElapsed(3725)).toBe("62:05");
  });

  it("drops fractions of a second", () => {
    expect(formatElapsed(75.9)).toBe("1:15");
  });
});

describe("pluralise", () => {
  it("uses the singular for one and the plural otherwise", () => {
    expect(pluralise(1, "check")).toBe("1 check");
    expect(pluralise(0, "check")).toBe("0 checks");
    expect(pluralise(2, "hint")).toBe("2 hints");
  });
});
