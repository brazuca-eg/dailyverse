import { describe, expect, it } from "vitest";
import {
  collectBatchIssues,
  collectDraftIssues,
  extractNumbers,
  hasErrors,
  normalizeForMatch,
} from "./checks";
import { createContext, createValidDraft } from "./fixtures";
import type { DraftPuzzle } from "./types";

function messagesFor(draft: DraftPuzzle, severity: "error" | "warning" = "error"): string[] {
  return collectDraftIssues(draft, createContext())
    .filter((issue) => issue.severity === severity)
    .map((issue) => issue.message);
}

describe("normalizeForMatch", () => {
  it("makes quotes tolerant of spacing, case and typographic punctuation", () => {
    expect(normalizeForMatch("  It’s   a\n“quote” – here ")).toBe('it\'s a "quote" - here');
  });
});

describe("extractNumbers", () => {
  it("finds plain, decimal and comma-separated numbers", () => {
    expect(extractNumbers("About 46.6 km, 1,882 people in 1882 and 60%")).toEqual([
      "46.6",
      "1882",
      "1882",
      "60",
    ]);
  });

  it("returns nothing when there are no digits", () => {
    expect(extractNumbers("no numbers here")).toEqual([]);
  });
});

describe("collectDraftIssues", () => {
  it("accepts a well-formed draft", () => {
    expect(collectDraftIssues(createValidDraft(), createContext())).toEqual([]);
  });

  it("rejects an unknown country code", () => {
    const draft = { ...createValidDraft(), country: "ZZ" };
    expect(messagesFor(draft)).toContain('unknown country code "ZZ"');
  });

  it("rejects a country that already has a puzzle", () => {
    const context = createContext({ existingCountryCodes: new Set(["SI"]) });
    const issues = collectDraftIssues(createValidDraft(), context);
    expect(issues.some((issue) => issue.message.includes("already has a published puzzle"))).toBe(
      true,
    );
  });

  it("rejects an unknown difficulty", () => {
    const draft = { ...createValidDraft(), difficulty: "brutal" as DraftPuzzle["difficulty"] };
    expect(messagesFor(draft)).toContain('unknown difficulty "brutal"');
  });

  it("requires exactly five clues", () => {
    const draft = createValidDraft();
    draft.clues = draft.clues.slice(0, 4);
    expect(messagesFor(draft)).toContain("needs exactly 5 clues, found 4");
  });

  it("rejects an unknown clue kind", () => {
    const draft = createValidDraft();
    draft.clues[0].kind = "weather" as DraftPuzzle["clues"][number]["kind"];
    expect(messagesFor(draft)).toContain('clue 1: unknown kind "weather"');
  });

  it("flags a clue that names the country", () => {
    const draft = createValidDraft();
    draft.clues[2].text = "Slovenia lies in Central Europe.";
    expect(messagesFor(draft)).toContain('clue 3: gives away the answer with "Slovenia"');
  });

  it("flags a clue that uses a nationality word", () => {
    const draft = createValidDraft();
    draft.clues[2].text = "This Slovenian region lies in Central Europe.";
    expect(messagesFor(draft)).toContain('clue 3: gives away the answer with "Slovenian"');
  });

  it("does not flag a neighbouring country's name that merely contains the answer's letters", () => {
    const draft = createValidDraft();
    draft.clues[1].text = "It borders Italy, Austria, Hungary and Croatia, all in Europe.";
    expect(messagesFor(draft)).toEqual([]);
  });

  it("flags a quote that is not in the article", () => {
    const draft = createValidDraft();
    draft.clues[1].evidence.quote = "It borders Spain, Portugal and a long list of other places";
    expect(messagesFor(draft)).toContain('clue 2: the quote was not found in "Slovenia"');
  });

  it("flags a quote that is too short to be meaningful", () => {
    const draft = createValidDraft();
    draft.clues[2].evidence.quote = "Central Europe";
    expect(messagesFor(draft)).toContain("clue 3: the quote is shorter than 25 characters");
  });

  it("flags a source page that was not fetched", () => {
    const draft = createValidDraft();
    draft.clues[0].evidence.page = "Atlantis";
    expect(messagesFor(draft)).toContain('clue 1: source page "Atlantis" was not fetched');
  });

  it("flags a number in a clue that the quote does not contain", () => {
    const draft = createValidDraft();
    draft.clues[0].text = "Its Adriatic Sea coastline is only about 99 kilometres long.";
    expect(messagesFor(draft)).toContain("clue 1: the number 99 does not appear in the quote");
  });

  it("flags a fun fact number that the quote does not contain", () => {
    const draft = createValidDraft();
    draft.reveal.funFact = "It has 7 forests, and it ranks second in Europe.";
    expect(messagesFor(draft)).toContain("fun fact: the number 7 does not appear in the quote");
  });

  it("requires the source URL to match the evidence page", () => {
    const draft = createValidDraft();
    draft.reveal.sourceUrl = "https://en.wikipedia.org/wiki/Croatia";
    expect(messagesFor(draft)).toContain(
      "source URL should be https://en.wikipedia.org/wiki/Slovenia",
    );
  });

  it("warns, but does not fail, about clue length", () => {
    const draft = createValidDraft();
    draft.clues[2].text = "Central Europe.";
    expect(messagesFor(draft)).toEqual([]);
    expect(messagesFor(draft, "warning")).toEqual(["clue 3: 15 characters, aim for 20 to 170"]);
  });
});

describe("collectBatchIssues", () => {
  it("flags a country that appears twice in a batch", () => {
    const issues = collectBatchIssues([createValidDraft(), createValidDraft()], createContext());
    expect(issues.some((issue) => issue.message === "appears more than once in this batch")).toBe(
      true,
    );
    expect(hasErrors(issues)).toBe(true);
  });

  it("warns about identical clues shared between different countries", () => {
    const other = createValidDraft();
    other.country = "HR";
    const issues = collectBatchIssues([createValidDraft(), other], createContext());
    expect(issues.some((issue) => issue.message === "shares an identical clue with SI")).toBe(true);
  });

  it("reports no issues for a clean batch", () => {
    expect(collectBatchIssues([createValidDraft()], createContext())).toEqual([]);
  });
});

describe("hasErrors", () => {
  it("is true only when an error is present", () => {
    expect(hasErrors([{ severity: "warning", puzzle: "SI", message: "x" }])).toBe(false);
    expect(hasErrors([{ severity: "error", puzzle: "SI", message: "x" }])).toBe(true);
    expect(hasErrors([])).toBe(false);
  });
});
