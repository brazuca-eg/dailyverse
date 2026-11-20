import { describe, expect, it } from "vitest";
import { createMemoryStore } from "../core/testing";
import { LOCALE_KEY, readLocalePreference, saveLocalePreference } from "./preference";

describe("locale preference", () => {
  it("is empty until the player chooses", () => {
    expect(readLocalePreference(createMemoryStore())).toBeNull();
  });

  it("saves a language and reads it back", () => {
    const store = createMemoryStore();
    expect(saveLocalePreference("uk", store)).toBe(true);
    expect(readLocalePreference(store)).toBe("uk");
  });

  it("ignores a stored value that is not a supported language", () => {
    expect(readLocalePreference(createMemoryStore({ [LOCALE_KEY]: '"pt"' }))).toBeNull();
    expect(readLocalePreference(createMemoryStore({ [LOCALE_KEY]: "oops" }))).toBeNull();
  });
});
