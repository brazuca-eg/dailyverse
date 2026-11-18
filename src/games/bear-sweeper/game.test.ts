import { describe, expect, it } from "vitest";
import { countAdjacentBears, listStartCells } from "./counts";
import { buildBearRound } from "./daily";
import { easyRound, listSafeCells } from "./fixtures";
import {
  FLAGGED,
  HIDDEN,
  MAX_LIVES,
  REVEALED,
  TRIGGERED,
  addElapsed,
  buildPuzzleId,
  calculateScore,
  chordCell,
  countBearsLeft,
  countEncounters,
  createInitialState,
  findHintCell,
  giveHint,
  giveUp,
  isStateForPuzzle,
  readLivesLeft,
  revealCell,
  toggleFlag,
  type BearState,
} from "./game";
import { readNeighbours } from "./grid";

const { puzzle } = easyRound;
const puzzleId = buildPuzzleId(easyRound);
const counts = countAdjacentBears(puzzle);
const clearing = new Set(listStartCells(puzzle));
const hiddenSafe = listSafeCells(puzzle).filter((index) => !clearing.has(index));
const [bearA, bearB, bearC] = puzzle.bears;

function fresh(): BearState {
  return createInitialState(puzzleId, puzzle);
}

function winByHints(state: BearState): BearState {
  const next = giveHint(state, puzzle);
  return next === state ? state : winByHints(next);
}

function loseBy(state: BearState): BearState {
  return [bearA, bearB, bearC].reduce((current, bear) => revealCell(current, puzzle, bear), state);
}

describe("buildPuzzleId and createInitialState", () => {
  it("names the puzzle by tier and place in the pool", () => {
    expect(puzzleId).toBe("easy:0");
  });

  it("opens the clearing and nothing else, playing", () => {
    const state = fresh();
    state.cells.forEach((cell, index) =>
      expect(cell).toBe(clearing.has(index) ? REVEALED : HIDDEN),
    );
    expect(state).toMatchObject({ hints: 0, elapsedSeconds: 0, status: "playing" });
  });
});

describe("counting", () => {
  it("starts with full lives and every bear still to find", () => {
    const state = fresh();
    expect(countEncounters(state)).toBe(0);
    expect(readLivesLeft(state)).toBe(MAX_LIVES);
    expect(countBearsLeft(state, puzzle)).toBe(puzzle.bears.length);
  });

  it("counts a flag and a bear that was met as found", () => {
    const flagged = toggleFlag(fresh(), hiddenSafe[0]);
    expect(countBearsLeft(flagged, puzzle)).toBe(puzzle.bears.length - 1);
    const met = revealCell(flagged, puzzle, bearA);
    expect(countBearsLeft(met, puzzle)).toBe(puzzle.bears.length - 2);
    expect(readLivesLeft(met)).toBe(MAX_LIVES - 1);
  });
});

describe("revealCell", () => {
  it("opens a hidden safe square", () => {
    const target = hiddenSafe.find((index) => counts[index] > 0) as number;
    const next = revealCell(fresh(), puzzle, target);
    expect(next.cells[target]).toBe(REVEALED);
    expect(next.status).toBe("playing");
  });

  it("opens a blank square and the blank area around it", () => {
    const blank = hiddenSafe.find((index) => counts[index] === 0);
    if (blank !== undefined) {
      const next = revealCell(fresh(), puzzle, blank);
      const opened = next.cells.filter((cell) => cell === REVEALED).length;
      expect(opened).toBeGreaterThan(clearing.size);
    }
    const numbered = hiddenSafe.find((index) => counts[index] > 0) as number;
    expect(
      revealCell(fresh(), puzzle, numbered).cells.filter((cell) => cell === REVEALED),
    ).toHaveLength(clearing.size + 1);
  });

  it("does not open a flagged square, or one that is already open", () => {
    const target = hiddenSafe[0];
    const flagged = toggleFlag(fresh(), target);
    expect(revealCell(flagged, puzzle, target)).toBe(flagged);
    const state = fresh();
    expect(revealCell(state, puzzle, puzzle.start)).toBe(state);
  });

  it("shows a bear, costs a life and keeps playing", () => {
    const next = revealCell(fresh(), puzzle, bearA);
    expect(next.cells[bearA]).toBe(TRIGGERED);
    expect(countEncounters(next)).toBe(1);
    expect(readLivesLeft(next)).toBe(2);
    expect(next.status).toBe("playing");
  });

  it("loses on the third bear", () => {
    const lost = loseBy(fresh());
    expect(countEncounters(lost)).toBe(MAX_LIVES);
    expect(lost.status).toBe("lost");
    expect(readLivesLeft(lost)).toBe(0);
  });

  it("does nothing after the game", () => {
    const lost = loseBy(fresh());
    expect(revealCell(lost, puzzle, hiddenSafe[0])).toBe(lost);
  });

  it("does not change the state it is given", () => {
    const state = fresh();
    revealCell(state, puzzle, bearA);
    expect(state.cells[bearA]).toBe(HIDDEN);
  });

  it("wins when the last safe square is opened", () => {
    const won = winByHints(fresh());
    expect(won.status).toBe("won");
    listSafeCells(puzzle).forEach((index) => expect(won.cells[index]).toBe(REVEALED));
  });
});

describe("toggleFlag", () => {
  it("flags a hidden square and clears the flag again", () => {
    const flagged = toggleFlag(fresh(), hiddenSafe[0]);
    expect(flagged.cells[hiddenSafe[0]]).toBe(FLAGGED);
    expect(toggleFlag(flagged, hiddenSafe[0]).cells[hiddenSafe[0]]).toBe(HIDDEN);
  });

  it("does nothing on an open square or a bear that was met", () => {
    const state = revealCell(fresh(), puzzle, bearA);
    expect(toggleFlag(state, puzzle.start)).toBe(state);
    expect(toggleFlag(state, bearA)).toBe(state);
  });

  it("does nothing after the game", () => {
    const lost = giveUp(fresh());
    expect(toggleFlag(lost, hiddenSafe[0])).toBe(lost);
  });
});

describe("chordCell", () => {
  const numbered = listSafeCells(puzzle).find(
    (index) =>
      counts[index] > 0 &&
      !clearing.has(index) &&
      readNeighbours(puzzle.size)[index].some(
        (next) => !clearing.has(next) && !puzzle.bears.includes(next),
      ),
  ) as number;
  const around = readNeighbours(puzzle.size)[numbered];
  const bearsAround = around.filter((next) => puzzle.bears.includes(next));

  function openNumbered(): BearState {
    return revealCell(fresh(), puzzle, numbered);
  }

  it("opens the squares around a number when the flags match it", () => {
    const flagged = bearsAround.reduce(
      (current, bear) => toggleFlag(current, bear),
      openNumbered(),
    );
    const next = chordCell(flagged, puzzle, numbered);
    around
      .filter((cell) => !puzzle.bears.includes(cell))
      .forEach((cell) => expect(next.cells[cell]).toBe(REVEALED));
    expect(countEncounters(next)).toBe(0);
  });

  it("does nothing when the flags do not match the number", () => {
    const state = openNumbered();
    expect(chordCell(state, puzzle, numbered)).toBe(state);
  });

  it("wakes a bear when a flag was in the wrong place, and counts a met bear as a flag", () => {
    const wrong = around.find(
      (cell) => !puzzle.bears.includes(cell) && state0().cells[cell] === HIDDEN,
    ) as number;
    const flags = [...bearsAround.slice(1), wrong];
    const flagged = flags.reduce((current, cell) => toggleFlag(current, cell), openNumbered());
    const next = chordCell(flagged, puzzle, numbered);
    expect(countEncounters(next)).toBeGreaterThanOrEqual(1);
    const met = revealCell(openNumbered(), puzzle, bearsAround[0]);
    const done = bearsAround.slice(1).reduce((current, bear) => toggleFlag(current, bear), met);
    expect(countEncounters(chordCell(done, puzzle, numbered))).toBe(1);
  });

  function state0(): BearState {
    return openNumbered();
  }

  it("does nothing on a hidden square, a blank square or after the game", () => {
    const state = fresh();
    expect(chordCell(state, puzzle, hiddenSafe[0])).toBe(state);
    const blank = [...clearing].find((index) => counts[index] === 0) as number;
    expect(chordCell(state, puzzle, blank)).toBe(state);
    const lost = giveUp(openNumbered());
    expect(chordCell(lost, puzzle, numbered)).toBe(lost);
  });
});

describe("chording with a bear that was already met", () => {
  const numbered = listSafeCells(puzzle).find(
    (index) =>
      counts[index] > 0 &&
      !clearing.has(index) &&
      readNeighbours(puzzle.size)[index].some(
        (next) => !clearing.has(next) && !puzzle.bears.includes(next),
      ),
  ) as number;
  const around = readNeighbours(puzzle.size)[numbered];
  const bearsAround = around.filter((next) => puzzle.bears.includes(next));

  it("counts the bear that was met like a flag", () => {
    const met = revealCell(revealCell(fresh(), puzzle, numbered), puzzle, bearsAround[0]);
    const flagged = bearsAround.slice(1).reduce((current, bear) => toggleFlag(current, bear), met);
    const next = chordCell(flagged, puzzle, numbered);
    around
      .filter((cell) => !puzzle.bears.includes(cell))
      .forEach((cell) => expect(next.cells[cell]).toBe(REVEALED));
    expect(countEncounters(next)).toBe(1);
  });
});

describe("opening a blank area", () => {
  it("leaves a flagged square flagged, and does not open it", () => {
    const found = Array.from({ length: 60 }, (_, index) => buildBearRound("easy", index)).flatMap(
      (round) => {
        const roundCounts = countAdjacentBears(round.puzzle);
        const roundClearing = new Set(listStartCells(round.puzzle));
        return Array.from({ length: round.puzzle.size ** 2 }, (_, blank) => blank)
          .filter(
            (blank) =>
              roundCounts[blank] === 0 &&
              !round.puzzle.bears.includes(blank) &&
              !roundClearing.has(blank),
          )
          .map((blank) => ({
            round,
            blank,
            neighbour: readNeighbours(round.puzzle.size)[blank].find(
              (next) => !round.puzzle.bears.includes(next) && !roundClearing.has(next),
            ),
          }))
          .filter((candidate) => candidate.neighbour !== undefined);
      },
    )[0];
    const { round, blank, neighbour } = found as {
      round: typeof easyRound;
      blank: number;
      neighbour: number;
    };
    const start = createInitialState(buildPuzzleId(round), round.puzzle);
    const flagged = toggleFlag(start, neighbour);
    const opened = revealCell(flagged, round.puzzle, blank);
    expect(opened.cells[blank]).toBe(REVEALED);
    expect(opened.cells[neighbour]).toBe(FLAGGED);
  });
});

describe("findHintCell and giveHint", () => {
  it("finds a hidden safe square that the numbers prove", () => {
    const cell = findHintCell(fresh(), puzzle) as number;
    expect(cell).not.toBeNull();
    expect(puzzle.bears).not.toContain(cell);
    expect(fresh().cells[cell]).toBe(HIDDEN);
  });

  it("opens it, counts a hint and does not cost a life", () => {
    const hinted = giveHint(fresh(), puzzle);
    expect(hinted.hints).toBe(1);
    expect(countEncounters(hinted)).toBe(0);
    expect(hinted.cells.filter((cell) => cell === REVEALED).length).toBeGreaterThan(
      clearing.size - 1,
    );
  });

  it("opens a flagged square when the hint says it is safe, taking the flag away", () => {
    const target = findHintCell(fresh(), puzzle) as number;
    const flagged = toggleFlag(fresh(), target);
    expect(findHintCell(flagged, puzzle)).toBe(target);
    const hinted = giveHint(flagged, puzzle);
    expect(hinted.cells[target]).toBe(REVEALED);
  });

  it("still works after a bear was met", () => {
    const met = revealCell(fresh(), puzzle, bearA);
    expect(giveHint(met, puzzle).hints).toBe(1);
  });

  it("can win the game, and does nothing after it", () => {
    const won = winByHints(fresh());
    expect(won.status).toBe("won");
    expect(giveHint(won, puzzle)).toBe(won);
    expect(findHintCell(won, puzzle)).toBeNull();
    const lost = giveUp(fresh());
    expect(giveHint(lost, puzzle)).toBe(lost);
  });
});

describe("giveUp and addElapsed", () => {
  it("ends the game as lost, once", () => {
    const lost = giveUp(fresh());
    expect(lost.status).toBe("lost");
    expect(giveUp(lost)).toBe(lost);
    const won = winByHints(fresh());
    expect(giveUp(won)).toBe(won);
  });

  it("adds seconds while playing only", () => {
    expect(addElapsed(fresh(), 5).elapsedSeconds).toBe(5);
    const lost = giveUp(fresh());
    expect(addElapsed(lost, 5)).toBe(lost);
  });
});

describe("calculateScore", () => {
  it("is 5 for a clean win, less for each bear and hint, and at least 1", () => {
    const won = winByHints(fresh());
    expect(calculateScore({ ...won, hints: 0 })).toBe(5);
    const withBear = revealCell({ ...won, status: "playing" }, puzzle, bearA);
    expect(calculateScore({ ...withBear, status: "won", hints: 1 })).toBe(3);
    expect(calculateScore({ ...won, hints: 9 })).toBe(1);
  });

  it("is 0 for a loss and while playing", () => {
    expect(calculateScore(loseBy(fresh()))).toBe(0);
    expect(calculateScore(fresh())).toBe(0);
  });
});

describe("isStateForPuzzle", () => {
  it("accepts a fresh state, one in progress, a won game, a lost game and one given up", () => {
    expect(isStateForPuzzle(fresh(), puzzle, puzzleId)).toBe(true);
    expect(
      isStateForPuzzle(
        revealCell(toggleFlag(fresh(), hiddenSafe[0]), puzzle, bearA),
        puzzle,
        puzzleId,
      ),
    ).toBe(true);
    expect(isStateForPuzzle(winByHints(fresh()), puzzle, puzzleId)).toBe(true);
    expect(isStateForPuzzle(loseBy(fresh()), puzzle, puzzleId)).toBe(true);
    expect(isStateForPuzzle(giveUp(fresh()), puzzle, puzzleId)).toBe(true);
  });

  it("rejects another puzzle and a grid of the wrong size", () => {
    expect(isStateForPuzzle(fresh(), puzzle, "easy:1")).toBe(false);
    expect(isStateForPuzzle({ ...fresh(), cells: [1, 0] }, puzzle, puzzleId)).toBe(false);
  });

  it("rejects squares with a code that does not exist, or a bear shown as open", () => {
    const bad = fresh();
    bad.cells[hiddenSafe[0]] = 7;
    expect(isStateForPuzzle(bad, puzzle, puzzleId)).toBe(false);
    const openBear = fresh();
    openBear.cells[bearA] = REVEALED;
    expect(isStateForPuzzle(openBear, puzzle, puzzleId)).toBe(false);
  });

  it("rejects a bear marked as met when the square has no bear", () => {
    const bad = fresh();
    bad.cells[hiddenSafe[0]] = TRIGGERED;
    expect(isStateForPuzzle(bad, puzzle, puzzleId)).toBe(false);
  });

  it("rejects a game without the starting clearing", () => {
    const bad = fresh();
    bad.cells[puzzle.start] = HIDDEN;
    expect(isStateForPuzzle(bad, puzzle, puzzleId)).toBe(false);
  });

  it("rejects a status that does not match the squares", () => {
    expect(isStateForPuzzle({ ...fresh(), status: "won" }, puzzle, puzzleId)).toBe(false);
    expect(isStateForPuzzle({ ...winByHints(fresh()), status: "playing" }, puzzle, puzzleId)).toBe(
      false,
    );
    expect(isStateForPuzzle({ ...loseBy(fresh()), status: "playing" }, puzzle, puzzleId)).toBe(
      false,
    );
    expect(isStateForPuzzle({ ...loseBy(fresh()), status: "won" }, puzzle, puzzleId)).toBe(false);
  });
});
