import { describe, expect, it } from "vitest";
import {
  applyCheck,
  applyMove,
  calculateScore,
  canCheck,
  createInitialState,
  MAX_CHECKS,
  MAX_SCORE,
  readCheckRows,
  readChecksLeft,
  readConfirmed,
  readStatus,
  type PeakState,
} from "./game";
import { buildPeakPuzzle } from "./puzzle";

const puzzle = buildPeakPuzzle("mountains", "medium", 0);
const SOLVED = [0, 1, 2, 3, 4];
const WRONG_ORDERS = [
  [1, 0, 2, 4, 3],
  [1, 2, 0, 3, 4],
  [4, 3, 2, 1, 0],
  [2, 0, 1, 4, 3],
  [3, 4, 0, 1, 2],
];

function withHistory(history: number[][], order = SOLVED): PeakState {
  return { puzzleId: puzzle.id, order: [...order], history };
}

function playWrongChecks(count: number): PeakState {
  return WRONG_ORDERS.slice(0, count).reduce(
    (state, order) => applyCheck({ ...state, order: [...order] }),
    createInitialState(puzzle),
  );
}

describe("createInitialState", () => {
  it("starts from the puzzle's scrambled order, with no checks", () => {
    const state = createInitialState(puzzle);
    expect(state).toEqual({ puzzleId: puzzle.id, order: [...puzzle.start], history: [] });
    expect(state.order).not.toBe(puzzle.start);
  });
});

describe("readStatus", () => {
  it("is playing until the order is right or the checks are used up", () => {
    expect(readStatus(createInitialState(puzzle))).toBe("playing");
    expect(readStatus(playWrongChecks(4))).toBe("playing");
  });

  it("is won as soon as a check is right, on any attempt", () => {
    expect(readStatus(withHistory([SOLVED]))).toBe("won");
    expect(readStatus(withHistory([...WRONG_ORDERS.slice(0, 4), SOLVED]))).toBe("won");
  });

  it("is lost after five wrong checks", () => {
    expect(readStatus(playWrongChecks(5))).toBe("lost");
  });
});

describe("readChecksLeft", () => {
  it("counts down from five", () => {
    expect(readChecksLeft(createInitialState(puzzle))).toBe(MAX_CHECKS);
    expect(readChecksLeft(playWrongChecks(2))).toBe(3);
    expect(readChecksLeft(playWrongChecks(5))).toBe(0);
  });
});

describe("applyMove", () => {
  it("moves an item and shifts the others", () => {
    const state = withHistory(
      [],
      [10, 11, 12, 13, 14].map((_, index) => index),
    );
    expect(applyMove(state, 0, 3).order).toEqual([1, 2, 3, 0, 4]);
  });

  it("does not change the state it is given", () => {
    const state = createInitialState(puzzle);
    const before = [...state.order];
    applyMove(state, 0, 4);
    expect(state.order).toEqual(before);
  });

  it("does nothing once the game is over", () => {
    const won = withHistory([SOLVED]);
    expect(applyMove(won, 0, 4)).toBe(won);
    const lost = playWrongChecks(5);
    expect(applyMove(lost, 0, 4)).toBe(lost);
  });

  it("refuses a position that does not exist", () => {
    expect(() => applyMove(createInitialState(puzzle), 0, 5)).toThrow();
  });
});

describe("canCheck", () => {
  it("is true at the start and after the order changes", () => {
    const state = createInitialState(puzzle);
    expect(canCheck(state)).toBe(true);
    const checked = applyCheck(state);
    expect(canCheck(checked)).toBe(false);
    expect(canCheck(applyMove(checked, 0, 1))).toBe(true);
  });

  it("is false again when the player puts the order back as it was checked", () => {
    const checked = applyCheck(createInitialState(puzzle));
    const moved = applyMove(checked, 0, 2);
    const back = applyMove(moved, 2, 0);
    expect(back.order).toEqual(checked.order);
    expect(canCheck(back)).toBe(false);
  });

  it("is false when the game is over", () => {
    expect(canCheck(withHistory([SOLVED]))).toBe(false);
    expect(canCheck({ ...playWrongChecks(5), order: [4, 3, 2, 1, 0] })).toBe(false);
  });
});

describe("applyCheck", () => {
  it("records the order that was checked", () => {
    const state = applyCheck(createInitialState(puzzle));
    expect(state.history).toEqual([[...puzzle.start]]);
  });

  it("keeps a copy, so later moves do not rewrite the history", () => {
    const checked = applyCheck(createInitialState(puzzle));
    const moved = applyMove(checked, 0, 4);
    expect(moved.history).toEqual([[...puzzle.start]]);
    expect(checked.history[0]).not.toBe(checked.order);
  });

  it("does not use up a check when nothing has changed", () => {
    const checked = applyCheck(createInitialState(puzzle));
    expect(applyCheck(checked)).toBe(checked);
  });

  it("does nothing once the game is over", () => {
    const won = withHistory([SOLVED]);
    expect(applyCheck(won)).toBe(won);
    const lost = playWrongChecks(5);
    expect(applyCheck({ ...lost, order: [1, 0, 3, 2, 4] })).toEqual({
      ...lost,
      order: [1, 0, 3, 2, 4],
    });
  });

  it("wins on a right order", () => {
    const state = applyCheck({ ...createInitialState(puzzle), order: [...SOLVED] });
    expect(readStatus(state)).toBe("won");
  });
});

describe("readConfirmed", () => {
  it("is empty before the first check", () => {
    expect(readConfirmed(createInitialState(puzzle))).toEqual([false, false, false, false, false]);
  });

  it("marks the positions that were right at the last check", () => {
    const state = applyCheck({ ...createInitialState(puzzle), order: [1, 0, 2, 4, 3] });
    expect(readConfirmed(state)).toEqual([false, false, true, false, false]);
  });

  it("keeps a mark while its item stays put, and drops it when the item moves or is shifted", () => {
    const checked = applyCheck({ ...createInitialState(puzzle), order: [0, 1, 2, 4, 3] });
    expect(readConfirmed(checked)).toEqual([true, true, true, false, false]);
    expect(readConfirmed(applyMove(checked, 3, 4))).toEqual([true, true, true, false, false]);
    expect(readConfirmed(applyMove(checked, 1, 0))).toEqual([false, false, true, false, false]);
    expect(readConfirmed(applyMove(checked, 0, 4))).toEqual([false, false, false, false, false]);
  });

  it("uses only the latest check", () => {
    const first = applyCheck({ ...createInitialState(puzzle), order: [0, 1, 2, 4, 3] });
    const second = applyCheck({ ...first, order: [1, 0, 2, 3, 4] });
    expect(readConfirmed(second)).toEqual([false, false, true, true, true]);
  });
});

describe("readCheckRows", () => {
  it("gives one row of right and wrong marks per check, oldest first", () => {
    const state = withHistory([[1, 0, 2, 4, 3], [0, 1, 2, 4, 3], SOLVED]);
    expect(readCheckRows(state)).toEqual([
      [false, false, true, false, false],
      [true, true, true, false, false],
      [true, true, true, true, true],
    ]);
  });
});

describe("calculateScore", () => {
  it("is 5 for a first-check win down to 1 for a fifth-check win", () => {
    expect(MAX_SCORE).toBe(5);
    [5, 4, 3, 2, 1].forEach((score, index) => {
      const history = [...WRONG_ORDERS.slice(0, index), SOLVED];
      expect(calculateScore(withHistory(history))).toBe(score);
    });
  });

  it("is 0 for a loss and while playing", () => {
    expect(calculateScore(playWrongChecks(5))).toBe(0);
    expect(calculateScore(createInitialState(puzzle))).toBe(0);
    expect(calculateScore(playWrongChecks(3))).toBe(0);
  });
});
