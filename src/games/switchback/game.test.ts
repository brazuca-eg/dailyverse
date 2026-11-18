import { describe, expect, it } from "vitest";
import {
  addElapsed,
  buildPuzzleId,
  calculateScore,
  canExtend,
  countCells,
  countReachedMarks,
  countSharedSteps,
  createInitialState,
  giveHint,
  giveUp,
  isComplete,
  isStateForPuzzle,
  moveTo,
  resetPath,
  undoStep,
  type SwitchbackState,
} from "./game";
import { easyRound, mediumRound } from "./fixtures";
import type { SwitchbackPuzzle } from "./types";

const { puzzle, solution } = easyRound;
const puzzleId = buildPuzzleId(easyRound);

function fresh(): SwitchbackState {
  return createInitialState(puzzleId, puzzle);
}

function follow(state: SwitchbackState, cells: readonly number[]): SwitchbackState {
  return cells.reduce((current, cell) => moveTo(current, puzzle, cell), state);
}

function solveAll(): SwitchbackState {
  return follow(fresh(), solution.slice(1));
}

const SMALL: SwitchbackPuzzle = { size: 3, marks: [0, 5, 8], walls: [[3, 4]] };
const SMALL_STATE: SwitchbackState = {
  puzzleId: "x",
  path: [0],
  hints: 0,
  elapsedSeconds: 0,
  status: "playing",
};

describe("buildPuzzleId and createInitialState", () => {
  it("names the puzzle by tier and place in the pool", () => {
    expect(puzzleId).toBe("easy:0");
  });

  it("starts on the first checkpoint, playing", () => {
    expect(fresh()).toEqual({
      puzzleId,
      path: [puzzle.marks[0]],
      hints: 0,
      elapsedSeconds: 0,
      status: "playing",
    });
  });
});

describe("counting", () => {
  it("counts squares and the checkpoints on the trail", () => {
    expect(countCells(puzzle)).toBe(25);
    expect(countReachedMarks(puzzle, [puzzle.marks[0]])).toBe(1);
    expect(countReachedMarks(puzzle, solution)).toBe(puzzle.marks.length);
  });
});

describe("canExtend", () => {
  it("allows a step to a free neighbouring square", () => {
    expect(canExtend(SMALL, [0], 1)).toBe(true);
    expect(canExtend(SMALL, [0], 3)).toBe(true);
  });

  it("refuses squares that are not neighbours, are off the grid or already on the trail", () => {
    expect(canExtend(SMALL, [0], 4)).toBe(false);
    expect(canExtend(SMALL, [0], 2)).toBe(false);
    expect(canExtend(SMALL, [0], 9)).toBe(false);
    expect(canExtend(SMALL, [0], -1)).toBe(false);
    expect(canExtend(SMALL, [0, 1], 0)).toBe(false);
  });

  it("refuses a step across a fence, either way round", () => {
    expect(canExtend(SMALL, [0, 3], 4)).toBe(false);
    expect(canExtend(SMALL, [0, 1, 4], 3)).toBe(false);
  });

  it("refuses a checkpoint out of order, and allows the next one", () => {
    expect(canExtend(SMALL, [0, 1, 2], 5)).toBe(true);
    expect(canExtend({ size: 3, marks: [0, 4, 2, 8], walls: [] }, [0, 1], 2)).toBe(false);
    expect(canExtend({ size: 3, marks: [0, 4, 2, 8], walls: [] }, [0, 1], 4)).toBe(true);
  });

  it("only allows the last checkpoint once every other square is covered", () => {
    expect(canExtend(SMALL, [0, 1, 2, 5, 4, 7], 8)).toBe(false);
    expect(canExtend(SMALL, [0, 1, 2, 5, 4, 7, 6], 8)).toBe(false);
    expect(canExtend(SMALL, [0, 3, 6, 7, 4, 1, 2, 5], 8)).toBe(true);
  });
});

describe("isComplete", () => {
  it("is true only for a full trail that ends on the last checkpoint", () => {
    expect(isComplete(puzzle, solution)).toBe(true);
    expect(isComplete(puzzle, solution.slice(0, -1))).toBe(false);
    expect(
      isComplete(puzzle, [
        ...solution.slice(0, -2),
        solution[solution.length - 1],
        solution[solution.length - 2],
      ]),
    ).toBe(false);
  });
});

describe("moveTo", () => {
  it("extends the trail by one step", () => {
    const next = moveTo(fresh(), puzzle, solution[1]);
    expect(next.path).toEqual([solution[0], solution[1]]);
  });

  it("ignores a square that cannot be entered", () => {
    const state = fresh();
    expect(moveTo(state, puzzle, solution[5])).toBe(state);
    expect(moveTo(state, puzzle, 99)).toBe(state);
  });

  it("ignores the square the trail already ends on", () => {
    const state = follow(fresh(), solution.slice(1, 4));
    expect(moveTo(state, puzzle, solution[3])).toBe(state);
  });

  it("takes a step back when the previous square is chosen", () => {
    const state = follow(fresh(), solution.slice(1, 4));
    expect(moveTo(state, puzzle, solution[2]).path).toEqual(solution.slice(0, 3));
  });

  it("cuts the trail back to any earlier square that is chosen", () => {
    const state = follow(fresh(), solution.slice(1, 8));
    expect(moveTo(state, puzzle, solution[2]).path).toEqual(solution.slice(0, 3));
    expect(moveTo(state, puzzle, solution[0]).path).toEqual([solution[0]]);
  });

  it("does not change the state it is given", () => {
    const state = fresh();
    moveTo(state, puzzle, solution[1]);
    expect(state.path).toEqual([solution[0]]);
  });

  it("wins when the trail covers every square and ends on the last checkpoint", () => {
    const won = solveAll();
    expect(won.status).toBe("won");
    expect(won.path).toEqual([...solution]);
  });

  it("does not win early, and does nothing after the game", () => {
    expect(follow(fresh(), solution.slice(1, -1)).status).toBe("playing");
    const won = solveAll();
    expect(moveTo(won, puzzle, solution[3])).toBe(won);
    const lost = giveUp(fresh());
    expect(moveTo(lost, puzzle, solution[1])).toBe(lost);
  });
});

describe("undoStep and resetPath", () => {
  it("removes the last step, but never the start", () => {
    const state = follow(fresh(), solution.slice(1, 4));
    expect(undoStep(state, puzzle).path).toEqual(solution.slice(0, 3));
    const start = fresh();
    expect(undoStep(start, puzzle)).toBe(start);
  });

  it("clears the trail back to the start", () => {
    const state = follow(fresh(), solution.slice(1, 6));
    expect(resetPath(state, puzzle).path).toEqual([solution[0]]);
    const start = fresh();
    expect(resetPath(start, puzzle)).toBe(start);
  });

  it("do nothing after the game", () => {
    const won = solveAll();
    expect(undoStep(won, puzzle)).toBe(won);
    expect(resetPath(won, puzzle)).toBe(won);
  });
});

describe("countSharedSteps", () => {
  it("counts how long the trail follows the solution", () => {
    expect(countSharedSteps([solution[0]], solution)).toBe(1);
    expect(countSharedSteps(solution.slice(0, 5), solution)).toBe(5);
    expect(countSharedSteps([...solution.slice(0, 3), 999], solution)).toBe(3);
    expect(countSharedSteps([999], solution)).toBe(0);
  });
});

describe("giveHint", () => {
  it("adds the next right step to a trail that is on the right track", () => {
    const state = follow(fresh(), solution.slice(1, 4));
    const hinted = giveHint(state, puzzle, solution);
    expect(hinted.path).toEqual(solution.slice(0, 5));
    expect(hinted.hints).toBe(1);
  });

  it("removes the wrong part of the trail and adds the right step", () => {
    const state: SwitchbackState = { ...fresh(), path: [...solution.slice(0, 4), 9999] };
    const hinted = giveHint(state, puzzle, solution);
    expect(hinted.path).toEqual(solution.slice(0, 5));
  });

  it("starts from the first step when the trail is only the start", () => {
    expect(giveHint(fresh(), puzzle, solution).path).toEqual(solution.slice(0, 2));
  });

  it("can finish the game", () => {
    const almost = follow(fresh(), solution.slice(1, -1));
    const hinted = giveHint(almost, puzzle, solution);
    expect(hinted.status).toBe("won");
    expect(hinted.hints).toBe(1);
  });

  it("does nothing after the game or when the trail is already the solution", () => {
    const won = solveAll();
    expect(giveHint(won, puzzle, solution)).toBe(won);
    const lost = giveUp(fresh());
    expect(giveHint(lost, puzzle, solution)).toBe(lost);
  });
});

describe("giveUp and addElapsed", () => {
  it("ends the game as lost, once", () => {
    const lost = giveUp(fresh());
    expect(lost.status).toBe("lost");
    expect(giveUp(lost)).toBe(lost);
    const won = solveAll();
    expect(giveUp(won)).toBe(won);
  });

  it("adds seconds while playing only", () => {
    expect(addElapsed(fresh(), 5).elapsedSeconds).toBe(5);
    const lost = giveUp(fresh());
    expect(addElapsed(lost, 5)).toBe(lost);
  });
});

describe("calculateScore", () => {
  it("is 5 for a clean solve, less for each hint, and at least 1", () => {
    const won = solveAll();
    expect(calculateScore(won)).toBe(5);
    expect(calculateScore({ ...won, hints: 2 })).toBe(3);
    expect(calculateScore({ ...won, hints: 9 })).toBe(1);
  });

  it("is 0 for a loss and while playing", () => {
    expect(calculateScore(giveUp(fresh()))).toBe(0);
    expect(calculateScore(fresh())).toBe(0);
  });
});

describe("isStateForPuzzle", () => {
  it("accepts a fresh state, one in progress, a won game and a lost game", () => {
    expect(isStateForPuzzle(fresh(), puzzle, puzzleId)).toBe(true);
    expect(isStateForPuzzle(follow(fresh(), solution.slice(1, 7)), puzzle, puzzleId)).toBe(true);
    expect(isStateForPuzzle(solveAll(), puzzle, puzzleId)).toBe(true);
    expect(isStateForPuzzle(giveUp(follow(fresh(), solution.slice(1, 7))), puzzle, puzzleId)).toBe(
      true,
    );
  });

  it("rejects another puzzle", () => {
    expect(isStateForPuzzle(fresh(), puzzle, "easy:1")).toBe(false);
  });

  it("rejects a trail that does not start on the first checkpoint", () => {
    expect(isStateForPuzzle({ ...fresh(), path: [solution[1]] }, puzzle, puzzleId)).toBe(false);
  });

  it("rejects a trail that goes back over a square without it being a plain step back", () => {
    const plain = solution.slice(1, 6).filter((cell) => !puzzle.marks.includes(cell));
    expect(plain.length).toBeGreaterThanOrEqual(2);
    const first = solution.indexOf(plain[0]);
    const looped = [...solution.slice(0, first + 2), solution[first]];
    expect(isStateForPuzzle({ ...fresh(), path: looped }, puzzle, puzzleId)).toBe(false);
  });

  it("rejects a trail that jumps, repeats a square, crosses a fence or breaks the order", () => {
    expect(
      isStateForPuzzle({ ...fresh(), path: [solution[0], solution[3]] }, puzzle, puzzleId),
    ).toBe(false);
    expect(
      isStateForPuzzle(
        { ...fresh(), path: [solution[0], solution[1], solution[0]] },
        puzzle,
        puzzleId,
      ),
    ).toBe(false);
    const fenced = mediumRound;
    const [first, second] = fenced.puzzle.walls[0];
    const crossing = {
      ...createInitialState(buildPuzzleId(fenced), fenced.puzzle),
      path: [fenced.puzzle.marks[0]],
    };
    expect(
      isStateForPuzzle(
        { ...crossing, path: [first, second] },
        fenced.puzzle,
        buildPuzzleId(fenced),
      ),
    ).toBe(false);
  });

  it("rejects a status that does not match the trail", () => {
    expect(isStateForPuzzle({ ...fresh(), status: "won" }, puzzle, puzzleId)).toBe(false);
    expect(isStateForPuzzle({ ...solveAll(), status: "playing" }, puzzle, puzzleId)).toBe(false);
  });

  it("works on a small fenced puzzle", () => {
    expect(isStateForPuzzle({ ...SMALL_STATE, puzzleId: "x" }, SMALL, "x")).toBe(true);
    expect(isStateForPuzzle({ ...SMALL_STATE, path: [0, 3, 4] }, SMALL, "x")).toBe(false);
  });
});
