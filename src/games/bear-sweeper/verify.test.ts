import { describe, expect, it } from "vitest";
import { createRandom, shuffle } from "../../core/random";
import { encodePuzzle } from "./codec";
import { bearData, type BearData } from "./data";
import { readNeighbours } from "./grid";
import { solveByLogic } from "./logic";
import { TIER_SETTINGS } from "./tiers";
import { verifyBearData } from "./verify";

const TIERS = ["easy", "medium", "hard"] as const;

function trimmed(): BearData {
  return structuredClone({
    easy: bearData.easy.slice(0, 5),
    medium: bearData.medium.slice(0, 5),
    hard: bearData.hard.slice(0, 5),
  });
}

function issuesOtherThanSize(data: BearData): string[] {
  return verifyBearData(data).filter((issue) => !/only \d+ puzzles/.test(issue));
}

function findEasyNineByNine() {
  const { size, bears } = TIER_SETTINGS.medium;
  for (let seed = 0; seed < 500; seed += 1) {
    const random = createRandom(seed);
    const start = Math.floor(random() * size * size);
    const blocked = new Set([start, ...readNeighbours(size)[start]]);
    const free = Array.from({ length: size * size }, (_, index) => index).filter(
      (index) => !blocked.has(index),
    );
    const puzzle = {
      size,
      bears: shuffle(free, random)
        .slice(0, bears)
        .sort((a, b) => a - b),
      start,
    };
    if (solveByLogic(puzzle, 1).solved) {
      return puzzle;
    }
  }
  throw new Error("No easy 9x9 puzzle found");
}

describe("the real Bear Sweeper data", () => {
  it("passes the verifier in full", () => {
    expect(verifyBearData(bearData)).toEqual([]);
  });

  it("has enough puzzles in each pool for two years", () => {
    TIERS.forEach((tier) => {
      expect(bearData[tier].length).toBeGreaterThanOrEqual(TIER_SETTINGS[tier].poolSize);
    });
  });
});

describe("verifyBearData finds", () => {
  it("too few puzzles", () => {
    expect(verifyBearData(trimmed()).join("\n")).toContain(
      `easy: only 5 puzzles, need ${TIER_SETTINGS.easy.poolSize}`,
    );
  });

  it("a duplicate puzzle", () => {
    const data = trimmed();
    data.medium[1] = structuredClone(data.medium[0]);
    expect(issuesOtherThanSize(data).join("\n")).toContain("medium #1: duplicate puzzle");
  });

  it("the wrong number of bears, repeated bears, bears off the grid or a bad start", () => {
    const data = trimmed();
    data.easy[0].b = data.easy[0].b.slice(1);
    data.easy[1].b = [...data.easy[1].b.slice(1), data.easy[1].b[1]];
    data.easy[2].b = [...data.easy[2].b.slice(1), 999];
    data.easy[3].s = -1;
    const text = issuesOtherThanSize(data).join("\n");
    ["#0", "#1", "#2", "#3"].forEach((id) =>
      expect(text).toContain(`easy ${id}: invalid bears or start`),
    );
  });

  it("a bear next to the starting clearing", () => {
    const data = trimmed();
    const [first] = data.medium[0].b;
    data.medium[0].s = first;
    expect(issuesOtherThanSize(data).join("\n")).toContain(
      "medium #0: a bear is next to the starting clearing",
    );
  });

  it("a puzzle that cannot be solved without guessing", () => {
    const data = trimmed();
    const size = TIER_SETTINGS.hard.size;
    const cells = size * size;
    data.hard[0] = {
      b: Array.from({ length: TIER_SETTINGS.hard.bears }, (_, index) => cells - 1 - index * 2),
      s: 0,
    };
    expect(issuesOtherThanSize(data).join("\n")).toContain(
      "hard #0: cannot be solved without guessing",
    );
  });

  it("a puzzle that is easier than its tier", () => {
    const data = trimmed();
    data.medium[0] = encodePuzzle(findEasyNineByNine());
    expect(issuesOtherThanSize(data).join("\n")).toContain(
      "medium #0: does not fit the medium rules (hardest step 1)",
    );
  });

  it("a starting clearing that opens too much", () => {
    const data = trimmed();
    const size = TIER_SETTINGS.easy.size;
    data.easy[0] = {
      b: Array.from({ length: TIER_SETTINGS.easy.bears }, (_, index) => size * size - 1 - index),
      s: 0,
    };
    expect(issuesOtherThanSize(data).join("\n")).toContain(
      "easy #0: the starting clearing opens too much",
    );
  });
});
