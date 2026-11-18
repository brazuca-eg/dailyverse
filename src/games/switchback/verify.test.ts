import { describe, expect, it } from "vitest";
import { switchbackData, type SwitchbackData } from "./data";
import { TIER_SETTINGS } from "./tiers";
import { verifySwitchbackData } from "./verify";

function trimmed(): SwitchbackData {
  return structuredClone({
    easy: switchbackData.easy.slice(0, 5),
    medium: switchbackData.medium.slice(0, 5),
    hard: switchbackData.hard.slice(0, 5),
  });
}

function issuesOtherThanSize(data: SwitchbackData): string[] {
  return verifySwitchbackData(data).filter((issue) => !/only \d+ puzzles/.test(issue));
}

describe("the real Switchback data", () => {
  it("passes the verifier in full", () => {
    expect(verifySwitchbackData(switchbackData)).toEqual([]);
  });

  it("has enough puzzles in each pool for two years", () => {
    DIFFICULTIES_LIST.forEach((tier) => {
      expect(switchbackData[tier].length).toBeGreaterThanOrEqual(TIER_SETTINGS[tier].poolSize);
    });
  });
});

const DIFFICULTIES_LIST = ["easy", "medium", "hard"] as const;

describe("verifySwitchbackData finds", () => {
  it("too few puzzles", () => {
    expect(verifySwitchbackData(trimmed()).join("\n")).toContain(
      `easy: only 5 puzzles, need ${TIER_SETTINGS.easy.poolSize}`,
    );
  });

  it("a duplicate puzzle", () => {
    const data = trimmed();
    data.medium[1] = structuredClone(data.medium[0]);
    expect(issuesOtherThanSize(data).join("\n")).toContain("medium #1: duplicate puzzle");
  });

  it("checkpoints that repeat or are off the grid", () => {
    const data = trimmed();
    data.easy[0].m = [3, 3, 7];
    data.easy[1].m = [0, 99];
    data.easy[2].m = [4];
    const text = issuesOtherThanSize(data).join("\n");
    expect(text).toContain("easy #0: invalid checkpoints or fences");
    expect(text).toContain("easy #1: invalid checkpoints or fences");
    expect(text).toContain("easy #2: invalid checkpoints or fences");
  });

  it("fences between squares that do not touch, or repeated, or odd in number", () => {
    const data = trimmed();
    data.medium[0].w = [0, 5];
    data.medium[1].w = [...data.medium[1].w.slice(0, 2), ...data.medium[1].w.slice(0, 2)];
    data.medium[2].w = [...data.medium[2].w, 1];
    const text = issuesOtherThanSize(data).join("\n");
    expect(text).toContain("medium #0: invalid checkpoints or fences");
    expect(text).toContain("medium #1: invalid checkpoints or fences");
    expect(text).toContain("medium #2: invalid checkpoints or fences");
  });

  it("a puzzle with too many or too few checkpoints or fences for its tier", () => {
    const data = trimmed();
    data.easy[0].w = [0, 1];
    data.hard[0].w = data.hard[0].w.slice(0, 2);
    const text = issuesOtherThanSize(data).join("\n");
    expect(text).toContain("easy #0:");
    expect(text).toContain("do not fit the easy rules");
    expect(text).toContain("hard #0:");
    expect(text).toContain("do not fit the hard rules");
  });

  it("a puzzle with more than one solution", () => {
    const data = trimmed();
    data.medium[0] = {
      m: [data.medium[0].m[0], data.medium[0].m[data.medium[0].m.length - 1]],
      w: [],
    };
    expect(issuesOtherThanSize(data).join("\n")).toContain(
      "medium #0: does not have exactly one solution",
    );
  });

  it("a puzzle with no solution", () => {
    const data = trimmed();
    data.easy[0] = { m: [0, 1], w: [] };
    expect(issuesOtherThanSize(data).join("\n")).toContain(
      "easy #0: does not have exactly one solution",
    );
  });
});
