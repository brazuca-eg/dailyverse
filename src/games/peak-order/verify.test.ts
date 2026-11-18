import { describe, expect, it } from "vitest";
import puzzleData from "./puzzles.json";
import { CATEGORY_IDS } from "./categories";
import { MAX_ITEM_USES } from "./pool";
import { TIER_RULES } from "./tiers";
import type { PeakData } from "./types";
import { verifyPeakData } from "./verify";

const real = puzzleData as unknown as PeakData;

function clone(): PeakData {
  return structuredClone(real);
}

describe("the real Peak Order data", () => {
  it("passes the verifier", () => {
    expect(verifyPeakData(real)).toEqual([]);
  });

  it("has every category with enough puzzles for two years", () => {
    CATEGORY_IDS.forEach((category) => {
      expect(real[category].medium.length).toBeGreaterThanOrEqual(TIER_RULES.medium.poolSize);
      expect(real[category].hard.length).toBeGreaterThanOrEqual(TIER_RULES.hard.poolSize);
    });
  });

  it("keeps only the items that puzzles use, in order of value", () => {
    CATEGORY_IDS.forEach((category) => {
      const { items, medium, hard } = real[category];
      const used = new Set([...medium, ...hard].flat());
      expect(used.size).toBe(items.length);
      expect(items.map((item) => item[1])).toEqual(
        [...items.map((item) => item[1])].sort((a, b) => a - b),
      );
    });
  });

  it("contains no object from another planet", () => {
    const names = CATEGORY_IDS.flatMap((category) => real[category].items.map((item) => item[0]));
    expect(names.filter((name) => /\b(Mons|Tholus|Patera|Mars|Olympus Mons)\b/.test(name))).toEqual(
      [],
    );
  });

  it("keeps famous items in medium puzzles", () => {
    const names = new Set(
      real.mountains.medium.flat().map((index) => real.mountains.items[index][0]),
    );
    expect(names.has("Mount Everest") || names.has("Mount Fuji") || names.has("Mont Blanc")).toBe(
      true,
    );
  });
});

describe("verifyPeakData finds", () => {
  it("an unusable name", () => {
    const data = clone();
    data.lakes.items[0][0] = "Lake 5";
    expect(verifyPeakData(data).join("\n")).toContain('lakes: unusable name "Lake 5"');
  });

  it("a duplicate name", () => {
    const data = clone();
    data.rivers.items[1][0] = data.rivers.items[0][0];
    expect(verifyPeakData(data).join("\n")).toContain("rivers: duplicate name");
  });

  it("a value that is not a whole number or is too small", () => {
    const data = clone();
    data.mountains.items[0][1] = 1.5;
    data.islands.items[0][1] = 1;
    const text = verifyPeakData(data).join("\n");
    expect(text).toContain("mountains:");
    expect(text).toContain("islands:");
    expect(text).toContain("invalid value");
  });

  it("too few puzzles", () => {
    const data = clone();
    data.volcanoes.hard = data.volcanoes.hard.slice(0, 10);
    expect(verifyPeakData(data).join("\n")).toContain("volcanoes hard: only 10 puzzles");
  });

  it("an index that does not exist, or a set of the wrong size", () => {
    const data = clone();
    data.lakes.medium[0] = [0, 1, 2, 3, 99999];
    data.lakes.medium[1] = [0, 1, 2];
    data.lakes.medium[2] = [0, 1, 2, 3, 1.5];
    const text = verifyPeakData(data).join("\n");
    expect(text).toContain("lakes medium #0: invalid item indexes");
    expect(text).toContain("lakes medium #1: invalid item indexes");
    expect(text).toContain("lakes medium #2: invalid item indexes");
  });

  it("a puzzle that breaks the tier rules", () => {
    const data = clone();
    data.rivers.medium[0] = [...data.rivers.medium[0]].reverse();
    expect(verifyPeakData(data).join("\n")).toContain(
      "rivers medium #0: does not fit the medium rules",
    );
  });

  it("a duplicate puzzle", () => {
    const data = clone();
    data.mountains.medium[1] = data.mountains.medium[0];
    expect(verifyPeakData(data).join("\n")).toContain("mountains medium #1: duplicate puzzle");
  });

  it("a puzzle shared by both tiers", () => {
    const data = clone();
    data.islands.hard[0] = data.islands.medium[0];
    expect(verifyPeakData(data).join("\n")).toContain("also a medium puzzle");
  });

  it("an item that is used too often", () => {
    const data = clone();
    const [first] = data.mountains.medium;
    const [pick] = first;
    const crowded = data.mountains.medium.filter((set) => set.includes(pick)).length;
    expect(crowded).toBeLessThanOrEqual(MAX_ITEM_USES);
    data.mountains.medium = data.mountains.medium.map((set) =>
      set.includes(pick) ? set : [pick, ...set.slice(1)],
    );
    expect(verifyPeakData(data).join("\n")).toContain("is used");
  });

  it("a popularity cut-off below the floor", () => {
    const data = clone();
    data.lakes.minEditions.medium = TIER_RULES.medium.floorEditions - 1;
    expect(verifyPeakData(data).join("\n")).toContain("lakes medium: the popularity cut-off");
    const missing = clone();
    (missing.lakes.minEditions as unknown as Record<string, unknown>).hard = undefined;
    expect(verifyPeakData(missing).join("\n")).toContain("lakes hard: the popularity cut-off");
  });

  it("an item less known than the cut-off", () => {
    const data = clone();
    data.rivers.minEditions.medium = 100000;
    expect(verifyPeakData(data).join("\n")).toContain(
      "rivers medium #0: does not fit the medium rules",
    );
  });
});
