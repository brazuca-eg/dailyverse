import { describe, expect, it } from "vitest";
import { countries } from "./countries";
import { getFlagEmoji } from "./flags";

describe("getFlagEmoji", () => {
  it("turns a country code into a flag emoji", () => {
    expect(getFlagEmoji("BR")).toBe("🇧🇷");
    expect(getFlagEmoji("NZ")).toBe("🇳🇿");
    expect(getFlagEmoji("XK")).toBe("🇽🇰");
  });

  it("accepts lowercase codes", () => {
    expect(getFlagEmoji("jp")).toBe("🇯🇵");
  });

  it("returns an empty string for invalid codes", () => {
    expect(getFlagEmoji("")).toBe("");
    expect(getFlagEmoji("BRA")).toBe("");
    expect(getFlagEmoji("1A")).toBe("");
  });

  it("produces exactly two symbols for every country in the list", () => {
    for (const country of countries) {
      expect([...getFlagEmoji(country.code)], country.name).toHaveLength(2);
    }
  });
});
