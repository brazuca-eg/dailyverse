import { describe, expect, it } from "vitest";
import { loadLocalNames, localisePuzzle } from "./localNames";
import { buildPeakPuzzle } from "./puzzle";

const puzzle = buildPeakPuzzle("mountains", "medium", 0);

describe("loadLocalNames", () => {
  it("loads the names of each language that has a file", async () => {
    for (const locale of ["es", "fr", "it", "de", "uk"] as const) {
      const names = await loadLocalNames(locale);
      expect(Object.keys(names ?? {}).sort()).toEqual([
        "islands",
        "lakes",
        "mountains",
        "rivers",
        "volcanoes",
      ]);
    }
  });

  it("has no names for English", async () => {
    expect(await loadLocalNames("en")).toBeNull();
  });

  it("has a name for most items in every language", async () => {
    const names = await loadLocalNames("uk");
    expect(Object.keys(names?.mountains ?? {}).length).toBeGreaterThan(100);
  });
});

describe("localisePuzzle", () => {
  it("changes nothing without names", () => {
    expect(localisePuzzle(puzzle, null)).toBe(puzzle);
  });

  it("replaces the names that have a translation and keeps the rest", () => {
    const [first, second] = puzzle.items;
    const names = {
      mountains: { [first.name]: "Nom traduit" },
      rivers: {},
      lakes: {},
      islands: {},
      volcanoes: {},
    };
    const local = localisePuzzle(puzzle, names);
    expect(local.items[0].name).toBe("Nom traduit");
    expect(local.items[1].name).toBe(second.name);
  });

  it("keeps the values, the order and everything else", () => {
    const names = { mountains: {}, rivers: {}, lakes: {}, islands: {}, volcanoes: {} };
    const local = localisePuzzle(puzzle, names);
    expect(local.items.map((item) => item.value)).toEqual(puzzle.items.map((item) => item.value));
    expect(local.id).toBe(puzzle.id);
    expect(local.start).toBe(puzzle.start);
  });

  it("uses the names of the category of the puzzle only", () => {
    const names = {
      mountains: {},
      rivers: { [puzzle.items[0].name]: "Wrong category" },
      lakes: {},
      islands: {},
      volcanoes: {},
    };
    expect(localisePuzzle(puzzle, names).items[0].name).toBe(puzzle.items[0].name);
  });
});
