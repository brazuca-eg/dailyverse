import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { buildPuzzleId } from "./game";
import { easyRound, listDirections } from "./fixtures";
import { switchbackStorage } from "./persistence";
import { useSwitchbackSession, type Direction } from "./useSwitchbackSession";

const { puzzle, solution } = easyRound;
const puzzleId = buildPuzzleId(easyRound);
const DAY = 0;
const DIRECTION_NAMES: Record<string, Direction> = {
  ArrowUp: "up",
  ArrowRight: "right",
  ArrowDown: "down",
  ArrowLeft: "left",
};

function renderSession(day = DAY) {
  return renderHook(() => useSwitchbackSession(switchbackStorage, easyRound, day));
}

type Session = ReturnType<typeof renderSession>;

function run(session: Session, action: (current: Session["result"]["current"]) => void) {
  act(() => action(session.result.current));
}

function walk(session: Session, steps: number) {
  listDirections(puzzle.size, solution)
    .slice(0, steps)
    .forEach((key) => run(session, (current) => current.step(DIRECTION_NAMES[key])));
}

describe("useSwitchbackSession", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("starts on the first checkpoint with no message", () => {
    const session = renderSession();
    expect(session.result.current.state.path).toEqual([puzzle.marks[0]]);
    expect(session.result.current.notice).toBeNull();
  });

  it("moves to a square and saves the trail", () => {
    const session = renderSession();
    run(session, (current) => current.move(solution[1]));
    expect(session.result.current.state.path).toEqual([solution[0], solution[1]]);
    expect(switchbackStorage.findSavedState(puzzleId, DAY)?.path).toEqual([
      solution[0],
      solution[1],
    ]);
  });

  it("steps in a direction from the end of the trail", () => {
    const session = renderSession();
    walk(session, 4);
    expect(session.result.current.state.path).toEqual(solution.slice(0, 5));
  });

  it("does nothing when a step would leave the grid", () => {
    const session = renderSession();
    const edge = (["up", "left"] as const).find((direction) => {
      const before = session.result.current.state;
      run(session, (current) => current.step(direction));
      return session.result.current.state === before;
    });
    expect(edge).toBeDefined();
  });

  it("goes back a step when the step leads to the square before", () => {
    const session = renderSession();
    walk(session, 3);
    const keys = listDirections(puzzle.size, solution);
    const opposite: Record<string, Direction> = {
      ArrowUp: "down",
      ArrowDown: "up",
      ArrowLeft: "right",
      ArrowRight: "left",
    };
    run(session, (current) => current.step(opposite[keys[2]]));
    expect(session.result.current.state.path).toEqual(solution.slice(0, 3));
  });

  it("undoes and resets, with a message for reset", () => {
    const session = renderSession();
    walk(session, 5);
    run(session, (current) => current.undo());
    expect(session.result.current.state.path).toEqual(solution.slice(0, 5));
    run(session, (current) => current.reset());
    expect(session.result.current.state.path).toEqual([solution[0]]);
    expect(session.result.current.notice).toBe("Trail cleared.");
  });

  it("announces a checkpoint when it is reached", () => {
    const session = renderSession();
    const second = solution.indexOf(puzzle.marks[1]);
    walk(session, second);
    expect(session.result.current.notice).toBe("Checkpoint 2 reached.");
  });

  it("corrects the trail with a hint", () => {
    const session = renderSession();
    run(session, (current) => current.hint());
    expect(session.result.current.state.path).toEqual(solution.slice(0, 2));
    expect(session.result.current.state.hints).toBe(1);
    expect(session.result.current.notice).toBe("Your trail was corrected one step.");
  });

  it("wins at the summit, announces it and records it once", () => {
    const session = renderSession();
    walk(session, solution.length - 1);
    expect(session.result.current.state.status).toBe("won");
    expect(session.result.current.notice).toBe("Summit reached! Every square is covered.");
    expect(session.result.current.stats).toMatchObject({
      gamesPlayed: 1,
      gamesWon: 1,
      currentStreak: 1,
    });
    expect(switchbackStorage.loadStats().gamesWon).toBe(1);
  });

  it("records a loss when the player gives up, then takes no more moves", () => {
    const session = renderSession();
    run(session, (current) => current.surrender());
    expect(session.result.current.stats).toMatchObject({ gamesPlayed: 1, gamesWon: 0 });
    const finished = session.result.current.state;
    run(session, (current) => current.move(solution[1]));
    run(session, (current) => current.hint());
    expect(session.result.current.state).toBe(finished);
    expect(session.result.current.stats.gamesPlayed).toBe(1);
  });

  it("counts the seconds, and not while the page is hidden", () => {
    const session = renderSession();
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(session.result.current.state.elapsedSeconds).toBe(3);
    const visibility = vi.spyOn(document, "visibilityState", "get").mockReturnValue("hidden");
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(session.result.current.state.elapsedSeconds).toBe(3);
    visibility.mockRestore();
  });

  it("restores the game when the page is opened again, for the same day only", () => {
    const first = renderSession();
    walk(first, 4);
    first.unmount();
    expect(renderSession().result.current.state.path).toEqual(solution.slice(0, 5));
    expect(renderSession(DAY + 1).result.current.state.path).toEqual([solution[0]]);
  });

  it("starts fresh when the saved trail does not fit the puzzle", () => {
    switchbackStorage.saveState(DAY, {
      puzzleId,
      path: [solution[0], solution[3]],
      hints: 0,
      elapsedSeconds: 0,
      status: "playing",
    });
    expect(renderSession().result.current.state.path).toEqual([solution[0]]);
  });

  it("uses the latest trail even when moves arrive before the next render", () => {
    const session = renderSession();
    act(() => {
      solution.slice(1, 5).forEach((cell) => session.result.current.move(cell));
    });
    expect(session.result.current.state.path).toEqual(solution.slice(0, 5));
  });

  it("steps from the latest end of the trail even when steps arrive before the next render", () => {
    const session = renderSession();
    const keys = listDirections(puzzle.size, solution)
      .slice(0, 3)
      .map((key) => DIRECTION_NAMES[key]);
    act(() => {
      keys.forEach((direction) => session.result.current.step(direction));
    });
    expect(session.result.current.state.path).toEqual(solution.slice(0, 4));
  });
});
