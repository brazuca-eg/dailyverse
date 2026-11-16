import { describe, expect, it } from "vitest";
import { containsWholeWord, escapeRegExp, foldText } from "./text";

describe("foldText", () => {
  it("lowercases and removes accents", () => {
    expect(foldText("Côte d'Ivoire")).toBe("cote d'ivoire");
    expect(foldText("São Tomé")).toBe("sao tome");
  });
});

describe("escapeRegExp", () => {
  it("escapes regular expression characters", () => {
    expect(escapeRegExp("a.b*c")).toBe("a\\.b\\*c");
  });
});

describe("containsWholeWord", () => {
  it("matches whole words only", () => {
    expect(containsWholeWord("Visit the UK today", "UK")).toBe(true);
    expect(containsWholeWord("A duke from Turkey", "UK")).toBe(false);
    expect(containsWholeWord("Next to Nigeria", "Niger")).toBe(false);
    expect(containsWholeWord("Capital of Niger.", "Niger")).toBe(true);
  });

  it("matches multi-word names", () => {
    expect(containsWholeWord("A South African landmark", "South African")).toBe(true);
  });

  it("ignores accents and case", () => {
    expect(containsWholeWord("Coffee from Cote d'Ivoire", "Côte d'Ivoire")).toBe(true);
  });
});
