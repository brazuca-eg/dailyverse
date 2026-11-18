import { describe, expect, it } from "vitest";
import {
  addElapsed,
  buildPuzzleId,
  calculateScore,
  checkBoard,
  countDigit,
  countFilled,
  createInitialState,
  enterDigit,
  eraseCell,
  findConflicts,
  findHintCell,
  giveHint,
  giveUp,
  isSolved,
  isStateForPuzzle,
  readValues,
  toggleNote,
  undoMove,
  type SudokuState,
} from "./game";
import { easyRound, findEmptyCells, hardRound } from "./fixtures";

const { puzzle } = easyRound;
const puzzleId = buildPuzzleId(easyRound);
const empties = findEmptyCells(easyRound);
const [first, second] = empties;
const given = puzzle.givens.findIndex((digit) => digit !== 0);

function fresh(): SudokuState {
  return createInitialState(puzzleId, puzzle.size);
}

function wrongDigit(index: number): number {
  return (puzzle.solution[index] % puzzle.size) + 1;
}

function solveAll(state: SudokuState): SudokuState {
  return empties.reduce(
    (current, index) => enterDigit(current, puzzle, index, puzzle.solution[index]),
    state,
  );
}

describe("buildPuzzleId and createInitialState", () => {
  it("names the puzzle by tier and place in the pool", () => {
    expect(puzzleId).toBe("easy:0");
  });

  it("starts empty and playing", () => {
    const state = fresh();
    expect(state.entries).toEqual(Array.from({ length: 36 }, () => 0));
    expect(state.notes).toEqual(Array.from({ length: 36 }, () => 0));
    expect(state).toMatchObject({
      flagged: [],
      moves: [],
      checks: 0,
      hints: 0,
      elapsedSeconds: 0,
      status: "playing",
    });
  });
});

describe("readValues, isSolved and counting", () => {
  it("shows the givens and the player's entries together", () => {
    const state = enterDigit(fresh(), puzzle, first, 3);
    const values = readValues(puzzle, state.entries);
    expect(values[first]).toBe(3);
    expect(values[given]).toBe(puzzle.givens[given]);
  });

  it("is solved only when every square matches the solution", () => {
    expect(isSolved(puzzle, fresh().entries)).toBe(false);
    expect(isSolved(puzzle, solveAll(fresh()).entries)).toBe(true);
  });

  it("counts filled squares and each digit", () => {
    const clues = puzzle.givens.filter((digit) => digit !== 0).length;
    expect(countFilled(puzzle, fresh().entries)).toBe(clues);
    expect(countFilled(puzzle, enterDigit(fresh(), puzzle, first, 2).entries)).toBe(clues + 1);
    expect(countDigit(puzzle, solveAll(fresh()).entries, 1)).toBe(6);
  });
});

describe("enterDigit", () => {
  it("puts a digit in an empty square and records the move", () => {
    const state = enterDigit(fresh(), puzzle, first, 4);
    expect(state.entries[first]).toBe(4);
    expect(state.moves).toEqual([{ index: first, entry: 0, notes: 0 }]);
  });

  it("clears the square when the same digit is entered again", () => {
    const once = enterDigit(fresh(), puzzle, first, 4);
    expect(enterDigit(once, puzzle, first, 4).entries[first]).toBe(0);
  });

  it("replaces a different digit", () => {
    const once = enterDigit(fresh(), puzzle, first, 4);
    expect(enterDigit(once, puzzle, first, 5).entries[first]).toBe(5);
  });

  it("clears the notes of the square", () => {
    const noted = toggleNote(fresh(), puzzle, first, 2);
    expect(enterDigit(noted, puzzle, first, 4).notes[first]).toBe(0);
  });

  it("does not change a given, a digit that is too big or too small, or a finished game", () => {
    const state = fresh();
    expect(enterDigit(state, puzzle, given, 1)).toBe(state);
    expect(enterDigit(state, puzzle, first, 0)).toBe(state);
    expect(enterDigit(state, puzzle, first, 7)).toBe(state);
    const lost = giveUp(state);
    expect(enterDigit(lost, puzzle, first, 1)).toBe(lost);
  });

  it("does not change the state it is given", () => {
    const state = fresh();
    enterDigit(state, puzzle, first, 4);
    expect(state.entries[first]).toBe(0);
    expect(state.moves).toEqual([]);
  });

  it("wins when the last square is right", () => {
    expect(solveAll(fresh()).status).toBe("won");
  });

  it("does not win with a wrong digit in the last square", () => {
    const almost = empties
      .slice(0, -1)
      .reduce((state, index) => enterDigit(state, puzzle, index, puzzle.solution[index]), fresh());
    const last = empties[empties.length - 1];
    expect(enterDigit(almost, puzzle, last, wrongDigit(last)).status).toBe("playing");
  });

  it("clears a mark from a check on that square", () => {
    const wrong = enterDigit(fresh(), puzzle, first, wrongDigit(first));
    const checked = checkBoard(wrong, puzzle).state;
    expect(checked.flagged).toEqual([first]);
    expect(enterDigit(checked, puzzle, first, puzzle.solution[first]).flagged).toEqual([]);
  });
});

describe("toggleNote", () => {
  it("adds and removes a note", () => {
    const added = toggleNote(fresh(), puzzle, first, 3);
    expect(added.notes[first]).toBe(1 << 2);
    expect(toggleNote(added, puzzle, first, 5).notes[first]).toBe((1 << 2) | (1 << 4));
    expect(toggleNote(added, puzzle, first, 3).notes[first]).toBe(0);
  });

  it("does nothing on a square that has a digit, a given or a bad digit", () => {
    const filled = enterDigit(fresh(), puzzle, first, 2);
    expect(toggleNote(filled, puzzle, first, 3)).toBe(filled);
    const state = fresh();
    expect(toggleNote(state, puzzle, given, 3)).toBe(state);
    expect(toggleNote(state, puzzle, first, 0)).toBe(state);
    expect(toggleNote(state, puzzle, first, 7)).toBe(state);
  });
});

describe("eraseCell", () => {
  it("clears a digit and the notes", () => {
    expect(eraseCell(enterDigit(fresh(), puzzle, first, 2), puzzle, first).entries[first]).toBe(0);
    expect(eraseCell(toggleNote(fresh(), puzzle, first, 2), puzzle, first).notes[first]).toBe(0);
  });

  it("does nothing on an empty square or a given", () => {
    const state = fresh();
    expect(eraseCell(state, puzzle, first)).toBe(state);
    expect(eraseCell(state, puzzle, given)).toBe(state);
  });
});

describe("undoMove", () => {
  it("puts back the digit and the notes that were there before", () => {
    const noted = toggleNote(fresh(), puzzle, first, 2);
    const entered = enterDigit(noted, puzzle, first, 4);
    const undone = undoMove(entered, puzzle);
    expect(undone.entries[first]).toBe(0);
    expect(undone.notes[first]).toBe(1 << 1);
    expect(undoMove(undone, puzzle).notes[first]).toBe(0);
  });

  it("does nothing when there is nothing to undo, or the game is over", () => {
    const state = fresh();
    expect(undoMove(state, puzzle)).toBe(state);
    const won = solveAll(state);
    expect(undoMove(won, puzzle)).toBe(won);
  });

  it("drops a mark on the square it changes", () => {
    const wrong = enterDigit(fresh(), puzzle, first, wrongDigit(first));
    const checked = checkBoard(wrong, puzzle).state;
    expect(undoMove(checked, puzzle).flagged).toEqual([]);
  });
});

describe("checkBoard", () => {
  it("marks every wrong digit and costs a check", () => {
    const state = enterDigit(
      enterDigit(fresh(), puzzle, first, wrongDigit(first)),
      puzzle,
      second,
      wrongDigit(second),
    );
    const result = checkBoard(state, puzzle);
    expect(result.wrong).toBe(2);
    expect(result.state.flagged).toEqual([first, second]);
    expect(result.state.checks).toBe(1);
  });

  it("is free when everything entered is right, and clears old marks", () => {
    const right = enterDigit(fresh(), puzzle, first, puzzle.solution[first]);
    const result = checkBoard(right, puzzle);
    expect(result.wrong).toBe(0);
    expect(result.state.checks).toBe(0);
    expect(checkBoard({ ...right, flagged: [first] }, puzzle).state.flagged).toEqual([]);
  });

  it("ignores empty squares and does nothing after the game", () => {
    expect(checkBoard(fresh(), puzzle).wrong).toBe(0);
    const lost = giveUp(fresh());
    expect(checkBoard(lost, puzzle)).toEqual({ state: lost, wrong: 0 });
  });
});

describe("findHintCell and giveHint", () => {
  it("prefers the selected square when it needs help", () => {
    expect(findHintCell(fresh(), puzzle, second)).toBe(second);
  });

  it("otherwise picks the first square that needs help", () => {
    expect(findHintCell(fresh(), puzzle, given)).toBe(first);
    expect(findHintCell(fresh(), puzzle, null)).toBe(first);
    const filled = enterDigit(fresh(), puzzle, first, puzzle.solution[first]);
    expect(findHintCell(filled, puzzle, first)).toBe(second);
  });

  it("picks a wrong square too, and nothing when the grid is right", () => {
    const wrong = enterDigit(fresh(), puzzle, first, wrongDigit(first));
    expect(findHintCell(wrong, puzzle, null)).toBe(first);
    expect(findHintCell({ ...solveAll(fresh()) }, puzzle, null)).toBeNull();
  });

  it("fills the right digit, counts a hint and records the move", () => {
    const hinted = giveHint(fresh(), puzzle, second);
    expect(hinted.entries[second]).toBe(puzzle.solution[second]);
    expect(hinted.hints).toBe(1);
    expect(hinted.moves).toHaveLength(1);
  });

  it("does nothing after the game, or when there is nothing to hint", () => {
    const lost = giveUp(fresh());
    expect(giveHint(lost, puzzle, null)).toBe(lost);
    const won = solveAll(fresh());
    expect(giveHint(won, puzzle, null)).toBe(won);
  });

  it("can win the game", () => {
    const hinted = empties.reduce((state) => giveHint(state, puzzle, null), fresh());
    expect(hinted.status).toBe("won");
    expect(hinted.hints).toBe(empties.length);
  });
});

describe("giveUp and addElapsed", () => {
  it("ends the game as lost, once", () => {
    const lost = giveUp(fresh());
    expect(lost.status).toBe("lost");
    expect(giveUp(lost)).toBe(lost);
    const won = solveAll(fresh());
    expect(giveUp(won)).toBe(won);
  });

  it("adds seconds while playing only", () => {
    expect(addElapsed(fresh(), 5).elapsedSeconds).toBe(5);
    const lost = giveUp(fresh());
    expect(addElapsed(lost, 5)).toBe(lost);
  });
});

describe("findConflicts", () => {
  it("marks squares that share a digit with a peer", () => {
    const row = Math.floor(first / 6);
    const peer = puzzle.givens.findIndex(
      (digit, index) => digit !== 0 && Math.floor(index / 6) === row,
    );
    const state = enterDigit(fresh(), puzzle, first, puzzle.givens[peer]);
    const conflicts = findConflicts(puzzle, readValues(puzzle, state.entries));
    expect(conflicts).toContain(first);
    expect(conflicts).toContain(peer);
  });

  it("finds nothing in a correct grid or an empty one", () => {
    expect(findConflicts(puzzle, [...puzzle.solution])).toEqual([]);
    expect(
      findConflicts(
        puzzle,
        Array.from({ length: 36 }, () => 0),
      ),
    ).toEqual([]);
  });

  it("works for 9x9", () => {
    expect(findConflicts(hardRound.puzzle, [...hardRound.puzzle.solution])).toEqual([]);
    const clash = [...hardRound.puzzle.solution];
    clash[0] = clash[1];
    expect(findConflicts(hardRound.puzzle, clash)).toEqual(expect.arrayContaining([0, 1]));
  });
});

describe("calculateScore", () => {
  it("is 5 for a clean solve and falls with every check and hint, to at least 1", () => {
    const won = solveAll(fresh());
    expect(calculateScore(won)).toBe(5);
    expect(calculateScore({ ...won, checks: 2, hints: 1 })).toBe(2);
    expect(calculateScore({ ...won, checks: 9, hints: 9 })).toBe(1);
  });

  it("is 0 for a loss and while playing", () => {
    expect(calculateScore(giveUp(fresh()))).toBe(0);
    expect(calculateScore(fresh())).toBe(0);
  });
});

describe("isStateForPuzzle", () => {
  it("accepts a fresh state, one in progress and a won game", () => {
    expect(isStateForPuzzle(fresh(), puzzle, puzzleId)).toBe(true);
    expect(isStateForPuzzle(enterDigit(fresh(), puzzle, first, 2), puzzle, puzzleId)).toBe(true);
    expect(isStateForPuzzle(solveAll(fresh()), puzzle, puzzleId)).toBe(true);
    expect(isStateForPuzzle(giveUp(fresh()), puzzle, puzzleId)).toBe(true);
  });

  it("rejects another puzzle, or the wrong number of squares", () => {
    expect(isStateForPuzzle(fresh(), puzzle, "easy:1")).toBe(false);
    expect(isStateForPuzzle({ ...fresh(), entries: [0, 0] }, puzzle, puzzleId)).toBe(false);
    expect(isStateForPuzzle({ ...fresh(), notes: [0, 0] }, puzzle, puzzleId)).toBe(false);
  });

  it("rejects an entry in a given square, or a digit that is too big", () => {
    const onGiven = fresh();
    onGiven.entries[given] = 1;
    expect(isStateForPuzzle(onGiven, puzzle, puzzleId)).toBe(false);
    const big = fresh();
    big.entries[first] = 7;
    expect(isStateForPuzzle(big, puzzle, puzzleId)).toBe(false);
  });

  it("rejects notes on a given, or notes with digits that do not exist", () => {
    const onGiven = fresh();
    onGiven.notes[given] = 1;
    expect(isStateForPuzzle(onGiven, puzzle, puzzleId)).toBe(false);
    const big = fresh();
    big.notes[first] = 1 << 6;
    expect(isStateForPuzzle(big, puzzle, puzzleId)).toBe(false);
  });

  it("rejects marks and moves that point outside the grid", () => {
    expect(isStateForPuzzle({ ...fresh(), flagged: [36] }, puzzle, puzzleId)).toBe(false);
    expect(
      isStateForPuzzle(
        { ...fresh(), moves: [{ index: -1, entry: 0, notes: 0 }] },
        puzzle,
        puzzleId,
      ),
    ).toBe(false);
  });

  it("rejects a status that does not match the grid", () => {
    expect(isStateForPuzzle({ ...fresh(), status: "won" }, puzzle, puzzleId)).toBe(false);
    expect(isStateForPuzzle({ ...solveAll(fresh()), status: "playing" }, puzzle, puzzleId)).toBe(
      false,
    );
  });
});
