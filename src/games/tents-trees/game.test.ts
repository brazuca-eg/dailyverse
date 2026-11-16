import { describe, expect, it } from "vitest";
import {
  addElapsed,
  analyse,
  buildPuzzleId,
  calculateScore,
  check,
  clearBoard,
  countWrongMarks,
  createInitialState,
  cycleCell,
  EMPTY,
  giveHint,
  giveUp,
  GRASS,
  isStateForPuzzle,
  MAX_SCORE,
  paintGrass,
  readTents,
  TENT,
  undo,
  type TentsState,
} from "./game";
import { generateTentsPuzzle } from "./generator";
import { toIndex } from "./rules";

const puzzle = generateTentsPuzzle(3, "easy");
const puzzleId = buildPuzzleId(3, "easy");
const solutionIndexes = puzzle.solution.map((tent) => toIndex(puzzle.size, tent));
const treeIndexes = puzzle.trees.map((tree) => toIndex(puzzle.size, tree));
const emptyIndexes = Array.from({ length: puzzle.size * puzzle.size }, (_, index) => index).filter(
  (index) => !treeIndexes.includes(index) && !solutionIndexes.includes(index),
);

function fresh(): TentsState {
  return createInitialState(puzzleId, puzzle.size);
}

function placeTent(state: TentsState, index: number): TentsState {
  return cycleCell(state, puzzle, index);
}

function placeAll(state: TentsState, indexes: readonly number[]): TentsState {
  return indexes.reduce((current, index) => placeTent(current, index), state);
}

function solved(): TentsState {
  return placeAll(fresh(), solutionIndexes);
}

describe("createInitialState", () => {
  it("starts with an empty board, no help used and nothing recorded", () => {
    const state = fresh();
    expect(state.marks).toHaveLength(puzzle.size * puzzle.size);
    expect(state.marks.every((value) => value === EMPTY)).toBe(true);
    expect(state).toMatchObject({
      moves: [],
      checks: 0,
      hints: 0,
      elapsedSeconds: 0,
      status: "playing",
    });
  });

  it("names a puzzle by its seed and tier", () => {
    expect(buildPuzzleId(2005, "hard")).toBe("2005:hard");
  });
});

describe("cycleCell", () => {
  it("cycles a square from empty to tent to grass and back to empty", () => {
    const index = emptyIndexes[0];
    const tent = cycleCell(fresh(), puzzle, index);
    const grass = cycleCell(tent, puzzle, index);
    const empty = cycleCell(grass, puzzle, index);
    expect([tent.marks[index], grass.marks[index], empty.marks[index]]).toEqual([
      TENT,
      GRASS,
      EMPTY,
    ]);
  });

  it("records each change so it can be undone", () => {
    const index = emptyIndexes[0];
    const state = cycleCell(cycleCell(fresh(), puzzle, index), puzzle, index);
    expect(state.moves).toEqual([
      { index, before: EMPTY, after: TENT },
      { index, before: TENT, after: GRASS },
    ]);
  });

  it("leaves a tree square alone", () => {
    const state = cycleCell(fresh(), puzzle, treeIndexes[0]);
    expect(state).toEqual(fresh());
  });

  it("does not change the state it was given", () => {
    const initial = fresh();
    cycleCell(initial, puzzle, emptyIndexes[0]);
    expect(initial).toEqual(fresh());
  });

  it("wins the moment the tents follow every rule", () => {
    const almost = placeAll(fresh(), solutionIndexes.slice(0, -1));
    expect(almost.status).toBe("playing");
    expect(placeTent(almost, solutionIndexes[solutionIndexes.length - 1]).status).toBe("won");
  });

  it("does not care about grass marks when it checks for a win", () => {
    const withGrass = paintGrass(fresh(), puzzle, emptyIndexes.slice(0, 5));
    expect(placeAll(withGrass, solutionIndexes).status).toBe("won");
  });

  it("does not win while a tent is in the wrong place", () => {
    const state = placeAll(fresh(), [...solutionIndexes.slice(0, -1), emptyIndexes[0]]);
    expect(state.status).toBe("playing");
  });

  it("ignores every change once the round is over", () => {
    const won = solved();
    expect(cycleCell(won, puzzle, emptyIndexes[0])).toEqual(won);
    const lost = giveUp(fresh());
    expect(cycleCell(lost, puzzle, emptyIndexes[0])).toEqual(lost);
  });
});

describe("paintGrass", () => {
  it("fills empty squares with grass, one recorded move each", () => {
    const indexes = emptyIndexes.slice(0, 3);
    const state = paintGrass(fresh(), puzzle, indexes);
    indexes.forEach((index) => expect(state.marks[index]).toBe(GRASS));
    expect(state.moves).toHaveLength(3);
  });

  it("never overwrites a tent or touches a tree", () => {
    const withTent = placeTent(fresh(), emptyIndexes[0]);
    const state = paintGrass(withTent, puzzle, [emptyIndexes[0], treeIndexes[0]]);
    expect(state.marks[emptyIndexes[0]]).toBe(TENT);
    expect(state.marks[treeIndexes[0]]).toBe(EMPTY);
    expect(state.moves).toHaveLength(1);
  });

  it("does nothing once the round is over", () => {
    const won = solved();
    expect(paintGrass(won, puzzle, emptyIndexes)).toEqual(won);
  });
});

describe("undo", () => {
  it("takes back the last change", () => {
    const index = emptyIndexes[0];
    const state = undo(cycleCell(fresh(), puzzle, index), puzzle);
    expect(state.marks[index]).toBe(EMPTY);
    expect(state.moves).toEqual([]);
  });

  it("can take back as many changes as were made, in order", () => {
    const index = emptyIndexes[0];
    const twice = cycleCell(cycleCell(fresh(), puzzle, index), puzzle, index);
    const once = undo(twice, puzzle);
    expect(once.marks[index]).toBe(TENT);
    expect(undo(once, puzzle).marks[index]).toBe(EMPTY);
  });

  it("does nothing when there is nothing to undo", () => {
    expect(undo(fresh(), puzzle)).toEqual(fresh());
  });

  it("does nothing once the round is over", () => {
    const won = solved();
    expect(undo(won, puzzle)).toEqual(won);
  });

  it("keeps the checks, hints and time", () => {
    const base = {
      ...cycleCell(fresh(), puzzle, emptyIndexes[0]),
      checks: 2,
      hints: 1,
      elapsedSeconds: 90,
    };
    expect(undo(base, puzzle)).toMatchObject({ checks: 2, hints: 1, elapsedSeconds: 90 });
  });
});

describe("clearBoard", () => {
  it("empties every square and forgets the moves, but keeps checks, hints and time", () => {
    const busy = {
      ...paintGrass(placeAll(fresh(), emptyIndexes.slice(0, 2)), puzzle, emptyIndexes.slice(2, 5)),
      checks: 1,
      hints: 1,
      elapsedSeconds: 40,
    };
    const state = clearBoard(busy);
    expect(state.marks.every((value) => value === EMPTY)).toBe(true);
    expect(state.moves).toEqual([]);
    expect(state).toMatchObject({ checks: 1, hints: 1, elapsedSeconds: 40, status: "playing" });
  });

  it("does nothing once the round is over", () => {
    const won = solved();
    expect(clearBoard(won)).toEqual(won);
  });
});

describe("countWrongMarks and check", () => {
  it("counts a tent that is not in the solution and a grass mark on a solution tent", () => {
    const state = placeTent(fresh(), emptyIndexes[0]);
    expect(countWrongMarks(puzzle, state.marks)).toBe(1);
    const grassOnTent = cycleCell(
      placeTent(fresh(), solutionIndexes[0]),
      puzzle,
      solutionIndexes[0],
    );
    expect(countWrongMarks(puzzle, grassOnTent.marks)).toBe(1);
  });

  it("does not count correct tents, grass on empty squares or an empty board", () => {
    expect(countWrongMarks(puzzle, fresh().marks)).toBe(0);
    const state = paintGrass(
      placeAll(fresh(), solutionIndexes.slice(0, 2)),
      puzzle,
      emptyIndexes.slice(0, 4),
    );
    expect(countWrongMarks(puzzle, state.marks)).toBe(0);
  });

  it("costs a check when something is wrong, and says how many", () => {
    const wrong = placeAll(fresh(), emptyIndexes.slice(0, 2));
    const result = check(wrong, puzzle);
    expect(result.wrong).toBe(2);
    expect(result.state.checks).toBe(1);
  });

  it("costs nothing when everything so far is right", () => {
    const result = check(placeAll(fresh(), solutionIndexes.slice(0, 2)), puzzle);
    expect(result.wrong).toBe(0);
    expect(result.state.checks).toBe(0);
  });

  it("does not reveal which squares are wrong", () => {
    const result = check(placeTent(fresh(), emptyIndexes[0]), puzzle);
    expect(Object.keys(result).sort()).toEqual(["state", "wrong"]);
  });

  it("does nothing once the round is over", () => {
    const won = solved();
    expect(check(won, puzzle)).toEqual({ state: won, wrong: 0 });
  });
});

describe("giveHint", () => {
  it("places the first missing tent of the solution and costs a hint", () => {
    const state = giveHint(fresh(), puzzle);
    expect(state.marks[solutionIndexes[0]]).toBe(TENT);
    expect(state.hints).toBe(1);
    expect(state.moves).toHaveLength(1);
  });

  it("skips tents that are already placed", () => {
    const start = placeTent(fresh(), solutionIndexes[0]);
    expect(giveHint(start, puzzle).marks[solutionIndexes[1]]).toBe(TENT);
  });

  it("replaces a grass mark on a square that needs a tent", () => {
    const wrong = cycleCell(placeTent(fresh(), solutionIndexes[0]), puzzle, solutionIndexes[0]);
    expect(giveHint(wrong, puzzle).marks[solutionIndexes[0]]).toBe(TENT);
  });

  it("can finish the puzzle", () => {
    const almost = placeAll(fresh(), solutionIndexes.slice(0, -1));
    const state = giveHint(almost, puzzle);
    expect(state.status).toBe("won");
    expect(state.hints).toBe(1);
  });

  it("does not charge when every tent is already in place", () => {
    const won = solved();
    expect(giveHint(won, puzzle)).toEqual(won);
  });

  it("does nothing after giving up", () => {
    const lost = giveUp(fresh());
    expect(giveHint(lost, puzzle)).toEqual(lost);
  });
});

describe("giveUp and addElapsed", () => {
  it("gives up a round in progress but not one that was won", () => {
    expect(giveUp(fresh()).status).toBe("lost");
    const won = solved();
    expect(giveUp(won)).toEqual(won);
  });

  it("adds time while playing and ignores it once the round is over", () => {
    expect(addElapsed(addElapsed(fresh(), 5), 7).elapsedSeconds).toBe(12);
    const won = solved();
    expect(addElapsed(won, 30)).toEqual(won);
  });
});

describe("analyse", () => {
  it("shows every row and column as under before anything is placed", () => {
    const { rows, cols } = analyse(puzzle, fresh().marks);
    const needed = (counts: readonly number[]) =>
      counts.map((count) => (count > 0 ? "under" : "met"));
    expect(rows).toEqual(needed(puzzle.rowCounts));
    expect(cols).toEqual(needed(puzzle.colCounts));
  });

  it("shows every line as met for the finished solution", () => {
    const { rows, cols, clashing } = analyse(puzzle, solved().marks);
    expect(rows.every((status) => status === "met")).toBe(true);
    expect(cols.every((status) => status === "met")).toBe(true);
    expect(clashing).toEqual([]);
  });

  it("shows a line as over when it holds too many tents", () => {
    const row = puzzle.rowCounts.findIndex((count) => count === 0);
    const cells = Array.from({ length: puzzle.size }, (_, col) => row * puzzle.size + col).filter(
      (index) => !treeIndexes.includes(index),
    );
    const { rows } = analyse(puzzle, placeAll(fresh(), cells.slice(0, 1)).marks);
    expect(rows[row]).toBe("over");
  });

  it("flags tents that touch each other, side by side or at a corner", () => {
    const size = puzzle.size;
    const base = emptyIndexes.find(
      (index) =>
        index % size < size - 1 &&
        Math.floor(index / size) < size - 1 &&
        emptyIndexes.includes(index + 1) &&
        emptyIndexes.includes(index + size + 1),
    ) as number;
    const side = analyse(puzzle, placeAll(fresh(), [base, base + 1]).marks).clashing;
    expect(side).toEqual(expect.arrayContaining([base, base + 1]));
    const corner = analyse(puzzle, placeAll(fresh(), [base, base + size + 1]).marks).clashing;
    expect(corner).toEqual(expect.arrayContaining([base, base + size + 1]));
  });

  it("flags a tent with no tree beside it", () => {
    const size = puzzle.size;
    const lonely = emptyIndexes.find((index) => {
      const row = Math.floor(index / size);
      const col = index % size;
      return ![
        [-1, 0],
        [1, 0],
        [0, -1],
        [0, 1],
      ].some(
        ([dr, dc]) =>
          treeIndexes.includes((row + dr) * size + col + dc) &&
          row + dr >= 0 &&
          row + dr < size &&
          col + dc >= 0 &&
          col + dc < size,
      );
    }) as number;
    expect(analyse(puzzle, placeTent(fresh(), lonely).marks).clashing).toEqual([lonely]);
  });

  it("does not flag a single tent beside a tree", () => {
    expect(analyse(puzzle, placeTent(fresh(), solutionIndexes[0]).marks).clashing).toEqual([]);
  });

  it("does not count grass as a tent", () => {
    const state = paintGrass(fresh(), puzzle, emptyIndexes.slice(0, 6));
    expect(analyse(puzzle, state.marks).clashing).toEqual([]);
  });
});

describe("calculateScore", () => {
  it("gives the full score for a win with no checks or hints", () => {
    expect(calculateScore(solved())).toBe(MAX_SCORE);
  });

  it("takes a point for each check that found a mistake and each hint", () => {
    expect(calculateScore({ ...solved(), checks: 1 })).toBe(MAX_SCORE - 1);
    expect(calculateScore({ ...solved(), hints: 2 })).toBe(MAX_SCORE - 2);
    expect(calculateScore({ ...solved(), checks: 1, hints: 1 })).toBe(MAX_SCORE - 2);
  });

  it("never goes below one point for a win", () => {
    expect(calculateScore({ ...solved(), checks: 9, hints: 9 })).toBe(1);
  });

  it("gives nothing for giving up or a round still in progress", () => {
    expect(calculateScore(giveUp(fresh()))).toBe(0);
    expect(calculateScore(fresh())).toBe(0);
  });

  it("does not depend on how long it took", () => {
    expect(calculateScore({ ...solved(), elapsedSeconds: 5000 })).toBe(MAX_SCORE);
  });
});

describe("readTents", () => {
  it("lists only the tent squares, row by row", () => {
    const state = placeAll(paintGrass(fresh(), puzzle, emptyIndexes.slice(0, 3)), solutionIndexes);
    expect(readTents(puzzle.size, state.marks)).toEqual(puzzle.solution);
  });
});

describe("isStateForPuzzle", () => {
  it("accepts a fresh board, one in progress, a won one and a given-up one", () => {
    [fresh(), placeTent(fresh(), emptyIndexes[0]), solved(), giveUp(fresh())].forEach((state) => {
      expect(isStateForPuzzle(state, puzzle, puzzleId)).toBe(true);
    });
  });

  it("rejects a state from another puzzle", () => {
    expect(isStateForPuzzle(fresh(), puzzle, "999:hard")).toBe(false);
  });

  it("rejects a board of the wrong size", () => {
    expect(isStateForPuzzle({ ...fresh(), marks: [0, 0, 0] }, puzzle, puzzleId)).toBe(false);
  });

  it("rejects a mark on a tree", () => {
    const marks = fresh().marks.map((value, index) => (index === treeIndexes[0] ? TENT : value));
    expect(isStateForPuzzle({ ...fresh(), marks }, puzzle, puzzleId)).toBe(false);
  });

  it("rejects a move outside the board", () => {
    expect(
      isStateForPuzzle(
        { ...fresh(), moves: [{ index: 999, before: 0, after: 1 }] },
        puzzle,
        puzzleId,
      ),
    ).toBe(false);
  });

  it("rejects a won state that is not solved, and a solved board still marked as playing", () => {
    expect(isStateForPuzzle({ ...fresh(), status: "won" }, puzzle, puzzleId)).toBe(false);
    expect(isStateForPuzzle({ ...solved(), status: "playing" }, puzzle, puzzleId)).toBe(false);
  });
});
