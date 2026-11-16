import { describe, expect, it } from "vitest";
import { WEEKLY_DIFFICULTY_PATTERN } from "../../core/difficulty";
import { flagEntries, flagSchedule } from "./data";
import { buildFlagSchedule } from "./schedule";
import type { FlagEntry } from "./types";

const POOL_SAFE_DAYS = 28;

function entryOf(code: string, difficulty: FlagEntry["difficulty"]): FlagEntry {
  return { code, difficulty, focus: { x: 0.5, y: 0.5 } };
}

describe("buildFlagSchedule", () => {
  it("uses every flag exactly once before any repeats", () => {
    const codes = flagSchedule.map((entry) => entry.code);
    expect(new Set(codes).size).toBe(flagEntries.length);
    expect(codes).toHaveLength(flagEntries.length);
  });

  it("is the same every time for the same seed", () => {
    expect(buildFlagSchedule(flagEntries, 1)).toEqual(buildFlagSchedule(flagEntries, 1));
  });

  it("changes order with another seed", () => {
    expect(buildFlagSchedule(flagEntries, 1)).not.toEqual(buildFlagSchedule(flagEntries, 2));
  });

  it("follows the weekly easy, medium and hard pattern while every tier has flags left", () => {
    flagSchedule.slice(0, POOL_SAFE_DAYS).forEach((entry, day) => {
      expect(entry.difficulty).toBe(
        WEEKLY_DIFFICULTY_PATTERN[day % WEEKLY_DIFFICULTY_PATTERN.length],
      );
    });
  });

  it("falls back to another difficulty when the wanted one has run out", () => {
    const entries = [entryOf("AA", "easy"), entryOf("BB", "easy"), entryOf("CC", "easy")];
    const schedule = buildFlagSchedule(entries, 1);
    expect(schedule.map((entry) => entry.code).sort()).toEqual(["AA", "BB", "CC"]);
  });

  it("returns nothing for no flags", () => {
    expect(buildFlagSchedule([], 1)).toEqual([]);
  });

  it("does not change the entries it is given", () => {
    const entries = [entryOf("AA", "easy"), entryOf("BB", "hard")];
    buildFlagSchedule(entries, 1);
    expect(entries.map((entry) => entry.code)).toEqual(["AA", "BB"]);
  });
});
