import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { buildDailyRound } from "./daily";
import { buildPuzzleId, createInitialState, EMPTY, GRASS, TENT } from "./game";
import { tentsTreesStorage } from "./persistence";
import { toIndex } from "./rules";
import { useTentsSession } from "./useTentsSession";

const round = buildDailyRound(0);
const { puzzle } = round;
const puzzleId = buildPuzzleId(round.seed, round.tier);
const solution = puzzle.solution.map((tent) => toIndex(puzzle.size, tent));
const trees = new Set(puzzle.trees.map((tree) => toIndex(puzzle.size, tree)));
const spare = Array.from({ length: puzzle.size * puzzle.size }, (_, index) => index).filter(
  (index) => !trees.has(index) && !solution.includes(index),
);
const DAY = 0;

function renderSession(day = DAY) {
  return renderHook(() => useTentsSession(tentsTreesStorage, round, day));
}

type Session = ReturnType<typeof renderSession>;

function run(session: Session, action: (current: Session["result"]["current"]) => void) {
  act(() => action(session.result.current));
}

function solve(session: Session) {
  solution.forEach((index) => run(session, (current) => current.cycle(index)));
}

describe("useTentsSession", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("starts a fresh round with empty stats and no notice", () => {
    const { result } = renderSession();
    expect(result.current.state).toEqual(createInitialState(puzzleId, puzzle.size));
    expect(result.current.stats.gamesPlayed).toBe(0);
    expect(result.current.notice).toBeNull();
  });

  it("cycles a square and saves the round", () => {
    const session = renderSession();
    run(session, (current) => current.cycle(spare[0]));
    expect(session.result.current.state.marks[spare[0]]).toBe(TENT);
    expect(tentsTreesStorage.findSavedState(puzzleId, DAY)).toEqual(session.result.current.state);
  });

  it("paints grass on empty squares", () => {
    const session = renderSession();
    run(session, (current) => current.paint(spare.slice(0, 3)));
    spare
      .slice(0, 3)
      .forEach((index) => expect(session.result.current.state.marks[index]).toBe(GRASS));
  });

  it("undoes the last change", () => {
    const session = renderSession();
    run(session, (current) => current.cycle(spare[0]));
    run(session, (current) => current.undoMove());
    expect(session.result.current.state.marks[spare[0]]).toBe(EMPTY);
  });

  it("clears the board", () => {
    const session = renderSession();
    run(session, (current) => current.paint(spare.slice(0, 3)));
    run(session, (current) => current.clear());
    expect(session.result.current.state.marks.every((mark) => mark === EMPTY)).toBe(true);
  });

  it("says how many marks are wrong, and charges a check for it", () => {
    const session = renderSession();
    run(session, (current) => current.cycle(spare[0]));
    run(session, (current) => current.runCheck());
    expect(session.result.current.notice).toBe("1 mark is wrong. That cost a point.");
    expect(session.result.current.state.checks).toBe(1);
  });

  it("says when everything is right, at no cost", () => {
    const session = renderSession();
    run(session, (current) => current.cycle(solution[0]));
    run(session, (current) => current.runCheck());
    expect(session.result.current.notice).toBe("Everything so far is right.");
    expect(session.result.current.state.checks).toBe(0);
  });

  it("uses the plural for several wrong marks", () => {
    const session = renderSession();
    run(session, (current) => current.paint([solution[0], solution[1]]));
    run(session, (current) => current.runCheck());
    expect(session.result.current.notice).toBe("2 marks are wrong. That cost a point.");
  });

  it("clears the notice with the next change", () => {
    const session = renderSession();
    run(session, (current) => current.cycle(spare[0]));
    run(session, (current) => current.runCheck());
    run(session, (current) => current.cycle(spare[1]));
    expect(session.result.current.notice).toBeNull();
  });

  it("places a hint and charges for it", () => {
    const session = renderSession();
    run(session, (current) => current.hint());
    expect(session.result.current.state.marks[solution[0]]).toBe(TENT);
    expect(session.result.current.state.hints).toBe(1);
  });

  it("wins when the tents are right, and records the win in the stats once", () => {
    const session = renderSession();
    solve(session);
    expect(session.result.current.state.status).toBe("won");
    expect(session.result.current.stats).toMatchObject({
      gamesPlayed: 1,
      gamesWon: 1,
      currentStreak: 1,
      lastCompletedDay: DAY,
    });
    expect(tentsTreesStorage.loadStats()).toEqual(session.result.current.stats);
  });

  it("records a loss when the player gives up", () => {
    const session = renderSession();
    run(session, (current) => current.surrender());
    expect(session.result.current.state.status).toBe("lost");
    expect(session.result.current.stats).toMatchObject({
      gamesPlayed: 1,
      gamesWon: 0,
      currentStreak: 0,
    });
  });

  it("does not count a finished round again when the page is reopened", () => {
    const first = renderSession();
    solve(first);
    first.unmount();
    const reopened = renderSession();
    expect(reopened.result.current.state.status).toBe("won");
    expect(reopened.result.current.stats.gamesPlayed).toBe(1);
  });

  it("restores a round in progress, including its moves", () => {
    const first = renderSession();
    run(first, (current) => current.cycle(spare[0]));
    first.unmount();
    const reopened = renderSession();
    expect(reopened.result.current.state.marks[spare[0]]).toBe(TENT);
    expect(reopened.result.current.state.moves).toHaveLength(1);
  });

  it("ignores a round saved on another day or one that does not fit the puzzle", () => {
    tentsTreesStorage.saveState(DAY - 1, {
      ...createInitialState(puzzleId, puzzle.size),
      hints: 2,
    });
    expect(renderSession().result.current.state.hints).toBe(0);
    const marks = createInitialState(puzzleId, puzzle.size).marks.map((mark, index) =>
      trees.has(index) ? TENT : mark,
    );
    tentsTreesStorage.saveState(DAY, { ...createInitialState(puzzleId, puzzle.size), marks });
    expect(renderSession().result.current.state.marks.every((mark) => mark === EMPTY)).toBe(true);
  });

  it("builds a streak across consecutive days", () => {
    const dayOne = renderSession(1);
    solve(dayOne);
    dayOne.unmount();
    const dayTwo = renderHook(() => useTentsSession(tentsTreesStorage, buildDailyRound(2), 2));
    buildDailyRound(2).puzzle.solution.forEach((tent) =>
      act(() => dayTwo.result.current.cycle(toIndex(buildDailyRound(2).puzzle.size, tent))),
    );
    expect(dayTwo.result.current.stats).toMatchObject({ currentStreak: 2, maxStreak: 2 });
  });
});

describe("useTentsSession timer", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("counts a second at a time while playing", () => {
    const session = renderSession();
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(session.result.current.state.elapsedSeconds).toBe(3);
  });

  it("saves the time so a reload keeps it", () => {
    const first = renderSession();
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    first.unmount();
    expect(renderSession().result.current.state.elapsedSeconds).toBe(5);
  });

  it("stops counting once the round is over", () => {
    const session = renderSession();
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    run(session, (current) => current.surrender());
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(session.result.current.state.elapsedSeconds).toBe(2);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("does not count while the page is hidden", () => {
    vi.spyOn(document, "visibilityState", "get").mockReturnValue("hidden");
    const session = renderSession();
    act(() => {
      vi.advanceTimersByTime(4000);
    });
    expect(session.result.current.state.elapsedSeconds).toBe(0);
  });

  it("does not stop the clock when the player checks", () => {
    const session = renderSession();
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    run(session, (current) => current.runCheck());
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(session.result.current.state.elapsedSeconds).toBe(2);
  });
});
