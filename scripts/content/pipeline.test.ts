import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { countries } from "../../src/core/countries";
import { puzzles } from "../../src/games/mystery-place/data";
import { createValidDraft } from "./fixtures";
import { formatPuzzles } from "./format";
import { convertDraftsToPuzzles } from "./merge";
import { parseDrafts } from "./parse";
import { buildReviewSheet } from "./review";
import { calculateRunwayDays } from "./runway";

describe("formatPuzzles", () => {
  it("reproduces puzzles.json exactly, so merging never reformats existing puzzles", () => {
    const fileUrl = new URL("../../src/games/mystery-place/puzzles.json", import.meta.url);
    expect(formatPuzzles(puzzles)).toBe(readFileSync(fileUrl, "utf8"));
  });
});

describe("convertDraftsToPuzzles", () => {
  it("continues the id sequence and removes the evidence", () => {
    const [converted] = convertDraftsToPuzzles([createValidDraft()], puzzles);
    expect(converted.id).toBe(`mp-${String(puzzles.length + 1).padStart(4, "0")}`);
    expect(converted.country).toBe("SI");
    expect(JSON.stringify(converted)).not.toContain("evidence");
    expect(converted.clues).toHaveLength(5);
    expect(converted.reveal).toEqual({
      funFact: "It is the second most forested country in Europe.",
      sourceUrl: "https://en.wikipedia.org/wiki/Slovenia",
    });
  });

  it("numbers several drafts consecutively", () => {
    const second = { ...createValidDraft(), country: "HR" };
    const ids = convertDraftsToPuzzles([createValidDraft(), second], []).map((puzzle) => puzzle.id);
    expect(ids).toEqual(["mp-0001", "mp-0002"]);
  });

  it("refuses a draft without exactly five clues", () => {
    const draft = createValidDraft();
    draft.clues.pop();
    expect(() => convertDraftsToPuzzles([draft], puzzles)).toThrow("exactly 5 clues");
  });
});

describe("parseDrafts", () => {
  it("accepts a well-formed draft file", () => {
    expect(parseDrafts([createValidDraft()])).toEqual([createValidDraft()]);
  });

  it("explains where a malformed draft is wrong", () => {
    const broken = JSON.parse(JSON.stringify(createValidDraft()));
    delete broken.clues[2].evidence.quote;
    expect(() => parseDrafts([broken])).toThrow(
      "drafts[0].clues[2].evidence.quote must be a string",
    );
  });

  it("requires an array", () => {
    expect(() => parseDrafts({})).toThrow("JSON array");
  });

  it("requires clues to be an array", () => {
    const broken = { ...createValidDraft(), clues: "none" };
    expect(() => parseDrafts([broken])).toThrow("drafts[0].clues must be an array");
  });
});

describe("buildReviewSheet", () => {
  it("shows each clue next to its source quote", () => {
    const sheet = buildReviewSheet([createValidDraft()], countries, []);
    expect(sheet).toContain("## Slovenia (hard)");
    expect(sheet).toContain("1. [geography] Its Adriatic Sea coastline");
    expect(sheet).toContain('Source (Slovenia): "Slovenia is a country in Central Europe"');
    expect(sheet).toContain("All automatic checks passed.");
  });

  it("lists problems found by the checks", () => {
    const sheet = buildReviewSheet([createValidDraft()], countries, [
      { severity: "error", puzzle: "SI", message: "something is wrong" },
    ]);
    expect(sheet).toContain("- ERROR (SI): something is wrong");
  });
});

describe("calculateRunwayDays", () => {
  it("counts the fresh days left after today", () => {
    expect(calculateRunwayDays(30, 0)).toBe(29);
    expect(calculateRunwayDays(30, 10)).toBe(19);
    expect(calculateRunwayDays(30, 29)).toBe(0);
  });

  it("is zero once the list has been used up", () => {
    expect(calculateRunwayDays(30, 45)).toBe(0);
  });

  it("counts every puzzle before launch", () => {
    expect(calculateRunwayDays(30, -3)).toBe(30);
  });
});
