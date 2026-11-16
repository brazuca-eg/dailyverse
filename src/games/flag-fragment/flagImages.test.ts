import { describe, expect, it } from "vitest";
import { countries } from "../../core/countries";
import { findFlagUrl } from "./flagImages";

describe("findFlagUrl", () => {
  it("finds a flag image for every country", () => {
    const missing = countries.filter((country) => findFlagUrl(country.code) === null);
    expect(missing).toEqual([]);
  });

  it("matches by code regardless of case", () => {
    expect(findFlagUrl("ch")).toBe(findFlagUrl("CH"));
  });

  it("gives each country its own image", () => {
    expect(findFlagUrl("CH")).not.toBe(findFlagUrl("AT"));
    expect(findFlagUrl("RO")).not.toBe(findFlagUrl("TD"));
  });

  it("does not confuse a code with another that ends the same way", () => {
    expect(findFlagUrl("H")).toBeNull();
    expect(findFlagUrl("AU")).not.toBe(findFlagUrl("U"));
  });

  it("returns null for an unknown code", () => {
    expect(findFlagUrl("ZZ")).toBeNull();
  });
});
