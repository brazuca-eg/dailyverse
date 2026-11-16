import { describe, expect, it } from "vitest";
import { collectFactIssues, deriveFlagFacts, listFactPages, type FlagFactDraft } from "./facts";

const ARTICLE =
  "The flag of Portugal was announced in 1910, following the 5 October 1910 revolution. It has a green hoist.";

function draft(overrides: Partial<FlagFactDraft> = {}): FlagFactDraft {
  return {
    code: "PT",
    funFact: "Portugal's flag was announced in 1910, following the revolution of 5 October 1910.",
    evidence: {
      page: "Flag of Portugal",
      quote: "was announced in 1910, following the 5 October 1910 revolution",
    },
    ...overrides,
  };
}

const sources = new Map([["Flag of Portugal", ARTICLE]]);

function check(drafts: FlagFactDraft[], codes = ["PT"]): string[] {
  return collectFactIssues(drafts, codes, sources);
}

describe("collectFactIssues", () => {
  it("accepts a fact whose quote is in the article and whose numbers are in the quote", () => {
    expect(check([draft()])).toEqual([]);
  });

  it("matches the quote regardless of case, spacing and fancy punctuation", () => {
    const quote = "WAS  announced in 1910,\nfollowing the 5 October 1910 revolution";
    expect(check([draft({ evidence: { page: "Flag of Portugal", quote } })])).toEqual([]);
  });

  it("rejects a quote that is not in the article", () => {
    const evidence = { page: "Flag of Portugal", quote: "was announced in 1911 after a long war" };
    expect(check([draft({ evidence })])).toContain(
      'PT: the quote was not found in "Flag of Portugal"',
    );
  });

  it("rejects a number in the fact that the quote does not contain", () => {
    const issues = check([draft({ funFact: "Portugal's flag was announced in 1911, long ago." })]);
    expect(issues).toContain("PT: the number 1911 does not appear in the quote");
  });

  it("rejects a quote that is too short to prove anything", () => {
    const evidence = { page: "Flag of Portugal", quote: "green hoist" };
    expect(check([draft({ evidence })])).toContain("PT: the quote is shorter than 25 characters");
  });

  it("rejects a fact that is too short or too long", () => {
    expect(check([draft({ funFact: "Too short." })])).toContain(
      "PT: the fact must be 30 to 220 characters",
    );
    expect(check([draft({ funFact: "x".repeat(221) })])).toContain(
      "PT: the fact must be 30 to 220 characters",
    );
  });

  it("rejects a page that was not fetched", () => {
    const evidence = { page: "Flag of Spain", quote: "was announced in 1910, following the" };
    expect(check([draft({ evidence })])).toContain('PT: the page "Flag of Spain" was not fetched');
  });

  it("reports missing, unknown and duplicated countries", () => {
    const issues = check([draft(), draft(), draft({ code: "ZZ" })], ["PT", "ES"]);
    expect(issues).toContain("ES: there is no fact for this country");
    expect(issues).toContain("ZZ: this is not a known country");
    expect(issues).toContain("PT: there is more than one fact");
  });
});

describe("listFactPages", () => {
  it("lists each page once", () => {
    const other = draft({ code: "ES", evidence: { page: "Flag of Spain", quote: "x".repeat(30) } });
    expect(listFactPages([draft(), draft(), other])).toEqual(["Flag of Portugal", "Flag of Spain"]);
  });
});

describe("deriveFlagFacts", () => {
  it("keeps the fact and links to the Wikipedia page it came from", () => {
    expect(deriveFlagFacts([draft()])).toEqual({
      PT: {
        funFact:
          "Portugal's flag was announced in 1910, following the revolution of 5 October 1910.",
        sourceUrl: "https://en.wikipedia.org/wiki/Flag_of_Portugal",
      },
    });
  });

  it("encodes page titles that need it", () => {
    const evidence = { page: "Flag of São Tomé and Príncipe", quote: "x".repeat(30) };
    const facts = deriveFlagFacts([draft({ code: "ST", evidence })]);
    expect(facts.ST.sourceUrl).toBe(
      "https://en.wikipedia.org/wiki/Flag_of_S%C3%A3o_Tom%C3%A9_and_Pr%C3%ADncipe",
    );
  });
});
