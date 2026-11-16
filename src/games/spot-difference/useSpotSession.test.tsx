import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { buildPuzzleId, createInitialState, MAX_LIVES, type Point } from "./game";
import { generatePuzzle } from "./puzzle";
import { spotDifferenceStorage } from "./persistence";
import { useSpotSession } from "./useSpotSession";

const puzzle = generatePuzzle(3, "medium");
const puzzleId = buildPuzzleId(puzzle);
const DAY_INDEX = 1;
const nowhere: Point = { x: 2, y: 2 };

function centreOf(index: number): Point {
  const { region } = puzzle.differences[index];
  return { x: (region.left + region.right) / 2, y: (region.top + region.bottom) / 2 };
}

function renderSession(dayIndex = DAY_INDEX) {
  return renderHook(() => useSpotSession(spotDifferenceStorage, puzzle, dayIndex));
}

type Session = ReturnType<typeof renderSession>;

function tap(session: Session, point: Point) {
  act(() => session.result.current.tap(point));
}

describe("useSpotSession", () => {
  it("starts a fresh round with empty stats", () => {
    const { result } = renderSession();
    expect(result.current.state).toEqual(createInitialState(puzzleId));
    expect(result.current.stats.gamesPlayed).toBe(0);
    expect(result.current.miss).toBeNull();
    expect(result.current.lastOutcome).toBeNull();
  });

  it("records a found difference and saves the round", () => {
    const session = renderSession();
    tap(session, centreOf(0));
    expect(session.result.current.state.found).toEqual([puzzle.differences[0].id]);
    expect(session.result.current.lastOutcome).toBe("found");
    expect(spotDifferenceStorage.findSavedState(puzzleId, DAY_INDEX)).toEqual(
      session.result.current.state,
    );
  });

  it("uses the tolerance it is given", () => {
    const { region } = puzzle.differences[0];
    const near = { x: region.right + 20, y: (region.top + region.bottom) / 2 };
    const strict = renderSession();
    tap(strict, near);
    expect(strict.result.current.lastOutcome).toBe("missed");
    const generous = renderHook(() => useSpotSession(spotDifferenceStorage, puzzle, 5));
    act(() => generous.result.current.tap(near, 30));
    expect(generous.result.current.lastOutcome).toBe("found");
  });

  it("charges a life for a wrong tap and remembers where it was", () => {
    const session = renderSession();
    tap(session, nowhere);
    expect(session.result.current.state.mistakes).toBe(1);
    expect(session.result.current.lastOutcome).toBe("missed");
    expect(session.result.current.miss).toEqual({ point: nowhere, key: 1 });
  });

  it("gives each wrong tap its own mark key", () => {
    const session = renderSession();
    tap(session, nowhere);
    tap(session, { x: 5, y: 5 });
    expect(session.result.current.miss?.key).toBe(2);
  });

  it("does not charge or save again for a difference that was already found", () => {
    const session = renderSession();
    tap(session, centreOf(0));
    tap(session, centreOf(0));
    expect(session.result.current.lastOutcome).toBe("repeat");
    expect(session.result.current.state.mistakes).toBe(0);
    expect(session.result.current.state.found).toHaveLength(1);
  });

  it("does not touch the stats while the round is still going", () => {
    const session = renderSession();
    tap(session, centreOf(0));
    tap(session, nowhere);
    expect(spotDifferenceStorage.loadStats().gamesPlayed).toBe(0);
  });

  it("wins when all five are found and saves the stats", () => {
    const session = renderSession();
    puzzle.differences.forEach((_, index) => tap(session, centreOf(index)));
    expect(session.result.current.state.status).toBe("won");
    expect(session.result.current.stats).toMatchObject({
      gamesPlayed: 1,
      gamesWon: 1,
      currentStreak: 1,
      lastCompletedDay: DAY_INDEX,
    });
    expect(spotDifferenceStorage.loadStats()).toEqual(session.result.current.stats);
  });

  it("loses after the last life and records the loss", () => {
    const session = renderSession();
    Array.from({ length: MAX_LIVES }).forEach(() => tap(session, nowhere));
    expect(session.result.current.state.status).toBe("lost");
    expect(session.result.current.stats).toMatchObject({
      gamesPlayed: 1,
      gamesWon: 0,
      currentStreak: 0,
    });
  });

  it("ignores taps once the round is over, and keeps the stats as they were", () => {
    const session = renderSession();
    Array.from({ length: MAX_LIVES }).forEach(() => tap(session, nowhere));
    const before = session.result.current.stats;
    tap(session, centreOf(0));
    expect(session.result.current.lastOutcome).toBe("ignored");
    expect(session.result.current.state.found).toEqual([]);
    expect(session.result.current.stats).toEqual(before);
  });

  it("restores a round saved earlier the same day", () => {
    const first = renderSession();
    tap(first, centreOf(1));
    tap(first, nowhere);
    first.unmount();
    const reopened = renderSession();
    expect(reopened.result.current.state.found).toEqual([puzzle.differences[1].id]);
    expect(reopened.result.current.state.mistakes).toBe(1);
  });

  it("does not count a finished round again when the page is reopened", () => {
    const first = renderSession();
    puzzle.differences.forEach((_, index) => tap(first, centreOf(index)));
    first.unmount();
    const reopened = renderSession();
    expect(reopened.result.current.state.status).toBe("won");
    expect(reopened.result.current.stats.gamesPlayed).toBe(1);
  });

  it("ignores a round saved on another day", () => {
    spotDifferenceStorage.saveState(DAY_INDEX - 1, {
      ...createInitialState(puzzleId),
      mistakes: 2,
    });
    expect(renderSession().result.current.state.mistakes).toBe(0);
  });

  it("ignores a saved round that does not fit the puzzle", () => {
    spotDifferenceStorage.saveState(DAY_INDEX, {
      ...createInitialState(puzzleId),
      found: ["ghost-1"],
    });
    expect(renderSession().result.current.state.found).toEqual([]);
  });

  it("builds a streak across consecutive days", () => {
    const dayOne = renderSession(1);
    puzzle.differences.forEach((_, index) => tap(dayOne, centreOf(index)));
    dayOne.unmount();
    const dayTwo = renderSession(2);
    puzzle.differences.forEach((_, index) => tap(dayTwo, centreOf(index)));
    expect(dayTwo.result.current.stats).toMatchObject({ currentStreak: 2, maxStreak: 2 });
  });
});
