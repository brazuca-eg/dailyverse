import { describe, expect, it } from "vitest";
import {
  applyTap,
  buildPuzzleId,
  calculateScore,
  countLivesLeft,
  createInitialState,
  findHitDifference,
  isStateForPuzzle,
  MAX_LIVES,
  TAP_TOLERANCE,
  type Point,
  type SpotState,
} from "./game";
import { generatePuzzle } from "./puzzle";
import type { Bounds, Difference } from "./types";

const puzzle = generatePuzzle(3, "medium");
const puzzleId = buildPuzzleId(puzzle);

function centreOf(region: Bounds): Point {
  return { x: (region.left + region.right) / 2, y: (region.top + region.bottom) / 2 };
}

function farFromEverything(): Point {
  return { x: 2, y: 2 };
}

function findAll(state: SpotState): SpotState {
  return puzzle.differences.reduce(
    (current, difference) => applyTap(current, puzzle, centreOf(difference.region)).state,
    state,
  );
}

function missTimes(state: SpotState, times: number): SpotState {
  return Array.from({ length: times }).reduce<SpotState>(
    (current) => applyTap(current, puzzle, farFromEverything()).state,
    state,
  );
}

const box: Difference = {
  id: "a",
  kind: "move",
  region: { left: 100, top: 100, right: 140, bottom: 130 },
};

describe("createInitialState", () => {
  it("starts playing with nothing found and no mistakes", () => {
    expect(createInitialState("7:hard")).toEqual({
      puzzleId: "7:hard",
      found: [],
      mistakes: 0,
      status: "playing",
    });
  });

  it("names a puzzle by its seed and tier", () => {
    expect(buildPuzzleId({ seed: 1003, tier: "hard" })).toBe("1003:hard");
  });
});

describe("findHitDifference", () => {
  it("hits a tap inside the region", () => {
    expect(findHitDifference([box], { x: 120, y: 115 })).toBe(box);
  });

  it("also hits a tap just outside the region, within the tolerance", () => {
    expect(findHitDifference([box], { x: 140 + TAP_TOLERANCE, y: 115 })).toBe(box);
    expect(findHitDifference([box], { x: 120, y: 100 - TAP_TOLERANCE })).toBe(box);
  });

  it("misses a tap beyond the tolerance", () => {
    expect(findHitDifference([box], { x: 140 + TAP_TOLERANCE + 1, y: 115 })).toBeNull();
  });

  it("measures the tolerance from the corner, not the box around the corner", () => {
    const corner = TAP_TOLERANCE / Math.SQRT2 + 0.5;
    expect(findHitDifference([box], { x: 140 + corner, y: 130 + corner })).toBeNull();
    expect(findHitDifference([box], { x: 140 + corner - 2, y: 130 + corner - 2 })).toBe(box);
  });

  it("chooses the nearest difference when a tap is close to two", () => {
    const other: Difference = {
      ...box,
      id: "b",
      region: { left: 150, top: 100, right: 190, bottom: 130 },
    };
    expect(findHitDifference([box, other], { x: 143, y: 115 })?.id).toBe("a");
    expect(findHitDifference([box, other], { x: 147, y: 115 })?.id).toBe("b");
  });

  it("accepts a custom tolerance", () => {
    expect(findHitDifference([box], { x: 150, y: 115 }, 5)).toBeNull();
    expect(findHitDifference([box], { x: 150, y: 115 }, 10)).toBe(box);
  });

  it("finds nothing among no differences", () => {
    expect(findHitDifference([], { x: 1, y: 1 })).toBeNull();
  });
});

describe("applyTap", () => {
  it("finds a difference and records it", () => {
    const [first] = puzzle.differences;
    const result = applyTap(createInitialState(puzzleId), puzzle, centreOf(first.region));
    expect(result.outcome).toBe("found");
    expect(result.differenceId).toBe(first.id);
    expect(result.state.found).toEqual([first.id]);
    expect(result.state.mistakes).toBe(0);
    expect(result.state.status).toBe("playing");
  });

  it("hits a difference a little further away when given a wider tolerance", () => {
    const [first] = puzzle.differences;
    const near = {
      x: first.region.right + TAP_TOLERANCE + 8,
      y: (first.region.top + first.region.bottom) / 2,
    };
    expect(applyTap(createInitialState(puzzleId), puzzle, near).outcome).toBe("missed");
    expect(applyTap(createInitialState(puzzleId), puzzle, near, TAP_TOLERANCE + 10).outcome).toBe(
      "found",
    );
  });

  it("costs a life for a tap that finds nothing", () => {
    const result = applyTap(createInitialState(puzzleId), puzzle, farFromEverything());
    expect(result.outcome).toBe("missed");
    expect(result.differenceId).toBeNull();
    expect(result.state.mistakes).toBe(1);
    expect(result.state.found).toEqual([]);
  });

  it("does not charge for tapping a difference that was already found", () => {
    const [first] = puzzle.differences;
    const once = applyTap(createInitialState(puzzleId), puzzle, centreOf(first.region)).state;
    const again = applyTap(once, puzzle, centreOf(first.region));
    expect(again.outcome).toBe("repeat");
    expect(again.differenceId).toBe(first.id);
    expect(again.state).toEqual(once);
  });

  it("wins when all five are found, even after mistakes", () => {
    const state = findAll(missTimes(createInitialState(puzzleId), 2));
    expect(state.found).toHaveLength(5);
    expect(state.status).toBe("won");
    expect(state.mistakes).toBe(2);
  });

  it("loses when the third life is gone", () => {
    expect(missTimes(createInitialState(puzzleId), MAX_LIVES - 1).status).toBe("playing");
    expect(missTimes(createInitialState(puzzleId), MAX_LIVES).status).toBe("lost");
  });

  it("wins on the last difference even if it is the last life that remains", () => {
    const [first, second, third, fourth, fifth] = puzzle.differences;
    const taps = [first, second, third, fourth].map((difference) => centreOf(difference.region));
    const before = taps.reduce(
      (state, point) => applyTap(state, puzzle, point).state,
      missTimes(createInitialState(puzzleId), MAX_LIVES - 1),
    );
    expect(before.status).toBe("playing");
    expect(applyTap(before, puzzle, centreOf(fifth.region)).state.status).toBe("won");
  });

  it("ignores taps once the round is over", () => {
    const lost = missTimes(createInitialState(puzzleId), MAX_LIVES);
    const result = applyTap(lost, puzzle, centreOf(puzzle.differences[0].region));
    expect(result.outcome).toBe("ignored");
    expect(result.state).toEqual(lost);
    const won = findAll(createInitialState(puzzleId));
    expect(applyTap(won, puzzle, farFromEverything()).state).toEqual(won);
  });

  it("does not change the state it was given", () => {
    const initial = createInitialState(puzzleId);
    applyTap(initial, puzzle, centreOf(puzzle.differences[0].region));
    applyTap(initial, puzzle, farFromEverything());
    expect(initial).toEqual(createInitialState(puzzleId));
  });
});

describe("countLivesLeft and calculateScore", () => {
  it("counts lives left, never below zero", () => {
    expect(countLivesLeft(createInitialState(puzzleId))).toBe(3);
    expect(countLivesLeft(missTimes(createInitialState(puzzleId), 2))).toBe(1);
    expect(countLivesLeft({ ...createInitialState(puzzleId), mistakes: 9 })).toBe(0);
  });

  it("scores a win by the mistakes made: 5, 4 or 3 points", () => {
    expect(calculateScore(findAll(createInitialState(puzzleId)))).toBe(5);
    expect(calculateScore(findAll(missTimes(createInitialState(puzzleId), 1)))).toBe(4);
    expect(calculateScore(findAll(missTimes(createInitialState(puzzleId), 2)))).toBe(3);
  });

  it("scores nothing for a loss or a round still in progress", () => {
    expect(calculateScore(missTimes(createInitialState(puzzleId), 3))).toBe(0);
    expect(calculateScore(createInitialState(puzzleId))).toBe(0);
  });
});

describe("isStateForPuzzle", () => {
  const [first] = puzzle.differences;

  it("accepts a state that belongs to the puzzle", () => {
    expect(isStateForPuzzle(createInitialState(puzzleId), puzzle)).toBe(true);
    expect(isStateForPuzzle(findAll(createInitialState(puzzleId)), puzzle)).toBe(true);
    expect(isStateForPuzzle(missTimes(createInitialState(puzzleId), 3), puzzle)).toBe(true);
  });

  it("rejects a state from another puzzle", () => {
    expect(isStateForPuzzle(createInitialState("999:hard"), puzzle)).toBe(false);
  });

  it("rejects a state that lists a difference the puzzle does not have", () => {
    expect(isStateForPuzzle({ ...createInitialState(puzzleId), found: ["ghost-1"] }, puzzle)).toBe(
      false,
    );
  });

  it("rejects a state that lists the same difference twice", () => {
    expect(
      isStateForPuzzle({ ...createInitialState(puzzleId), found: [first.id, first.id] }, puzzle),
    ).toBe(false);
  });

  it("rejects a state whose status does not match what was found and missed", () => {
    expect(isStateForPuzzle({ ...createInitialState(puzzleId), status: "won" }, puzzle)).toBe(
      false,
    );
    expect(isStateForPuzzle({ ...createInitialState(puzzleId), mistakes: 3 }, puzzle)).toBe(false);
    expect(
      isStateForPuzzle({ ...createInitialState(puzzleId), mistakes: 1, status: "lost" }, puzzle),
    ).toBe(false);
  });
});
