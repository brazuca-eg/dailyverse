import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createMemoryStore } from "../../core/testing";
import { easyRound, findEmptyCells } from "./fixtures";
import { buildPuzzleId, createInitialState, enterDigit } from "./game";
import { trailSudokuStorage } from "./persistence";
import { useSudokuSession } from "./useSudokuSession";

const { puzzle } = easyRound;
const puzzleId = buildPuzzleId(easyRound);
const empties = findEmptyCells(easyRound);
const [first, second] = empties;
const DAY = 0;

function renderSession(day = DAY) {
  return renderHook(() => useSudokuSession(trailSudokuStorage, easyRound, day));
}

type Session = ReturnType<typeof renderSession>;

function run(session: Session, action: (current: Session["result"]["current"]) => void) {
  act(() => action(session.result.current));
}

function wrongDigit(index: number): number {
  return (puzzle.solution[index] % puzzle.size) + 1;
}

function solve(session: Session) {
  empties.forEach((index) => {
    run(session, (current) => current.select(index));
    run(session, (current) => current.enter(puzzle.solution[index]));
  });
}

describe("useSudokuSession", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("starts with the first empty square selected, notes off and no message", () => {
    const session = renderSession();
    expect(session.result.current.selected).toBe(first);
    expect(session.result.current.isNotesMode).toBe(false);
    expect(session.result.current.notice).toBeNull();
    expect(session.result.current.state.status).toBe("playing");
  });

  it("enters a digit into the selected square and saves it", () => {
    const session = renderSession();
    run(session, (current) => current.enter(4));
    expect(session.result.current.state.entries[first]).toBe(4);
    expect(trailSudokuStorage.findSavedState(puzzleId, DAY)?.entries[first]).toBe(4);
  });

  it("asks for a square when none is selected, and changes nothing", () => {
    const session = renderSession();
    const before = session.result.current.state;
    run(session, (current) => current.select(second));
    expect(session.result.current.selected).toBe(second);
    expect(before).toBe(session.result.current.state);
  });

  it("puts notes instead of digits when notes are on", () => {
    const session = renderSession();
    run(session, (current) => current.toggleNotesMode());
    run(session, (current) => current.enter(3));
    expect(session.result.current.isNotesMode).toBe(true);
    expect(session.result.current.state.entries[first]).toBe(0);
    expect(session.result.current.state.notes[first]).toBe(1 << 2);
    run(session, (current) => current.toggleNotesMode());
    expect(session.result.current.isNotesMode).toBe(false);
  });

  it("erases and undoes", () => {
    const session = renderSession();
    run(session, (current) => current.enter(4));
    run(session, (current) => current.erase());
    expect(session.result.current.state.entries[first]).toBe(0);
    run(session, (current) => current.undo());
    expect(session.result.current.state.entries[first]).toBe(4);
    run(session, (current) => current.undo());
    expect(session.result.current.state.entries[first]).toBe(0);
  });

  it("tells how many numbers are wrong after a check, and costs a point", () => {
    const session = renderSession();
    run(session, (current) => current.enter(wrongDigit(first)));
    run(session, (current) => current.runCheck());
    expect(session.result.current.notice).toBe("1 number is wrong. That cost a point.");
    expect(session.result.current.state.checks).toBe(1);
    run(session, (current) => current.select(second));
    run(session, (current) => current.enter(wrongDigit(second)));
    run(session, (current) => current.runCheck());
    expect(session.result.current.notice).toBe("2 numbers are wrong. That cost a point.");
  });

  it("says when everything entered is right, at no cost", () => {
    const session = renderSession();
    run(session, (current) => current.enter(puzzle.solution[first]));
    run(session, (current) => current.runCheck());
    expect(session.result.current.notice).toBe("Everything entered so far is right.");
    expect(session.result.current.state.checks).toBe(0);
  });

  it("fills the selected square with a hint", () => {
    const session = renderSession();
    run(session, (current) => current.select(second));
    run(session, (current) => current.hint());
    expect(session.result.current.state.entries[second]).toBe(puzzle.solution[second]);
    expect(session.result.current.state.hints).toBe(1);
  });

  it("wins when the grid is solved, and records it once", () => {
    const session = renderSession();
    solve(session);
    expect(session.result.current.state.status).toBe("won");
    expect(session.result.current.stats).toMatchObject({
      gamesPlayed: 1,
      gamesWon: 1,
      currentStreak: 1,
    });
    expect(trailSudokuStorage.loadStats().gamesWon).toBe(1);
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

  it("takes no more input after the game", () => {
    const session = renderSession();
    run(session, (current) => current.surrender());
    const finished = session.result.current.state;
    run(session, (current) => current.enter(4));
    run(session, (current) => current.undo());
    run(session, (current) => current.hint());
    expect(session.result.current.state).toBe(finished);
    expect(session.result.current.stats.gamesPlayed).toBe(1);
  });

  it("does not count time until the first move, then starts counting", () => {
    const session = renderSession();
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(session.result.current.state.elapsedSeconds).toBe(0);
    expect(vi.getTimerCount()).toBe(0);
    run(session, (current) => current.select(empties[0]));
    run(session, (current) => current.enter(wrongDigit(empties[0])));
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(session.result.current.state.elapsedSeconds).toBe(2);
  });

  it("counts the seconds, and saves them", () => {
    const session = renderSession();
    run(session, (current) => current.select(empties[0]));
    run(session, (current) => current.enter(wrongDigit(empties[0])));
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(session.result.current.state.elapsedSeconds).toBe(3);
    expect(trailSudokuStorage.findSavedState(puzzleId, DAY)?.elapsedSeconds).toBe(3);
  });

  it("does not count while the page is hidden, and stops after the game", () => {
    const session = renderSession();
    const visibility = vi.spyOn(document, "visibilityState", "get").mockReturnValue("hidden");
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(session.result.current.state.elapsedSeconds).toBe(0);
    visibility.mockRestore();
    run(session, (current) => current.surrender());
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(session.result.current.state.elapsedSeconds).toBe(0);
  });

  it("restores the game when the page is opened again, for the same day only", () => {
    const first = renderSession();
    run(first, (current) => current.enter(4));
    first.unmount();
    expect(renderSession().result.current.state.entries[empties[0]]).toBe(4);
    expect(renderSession(DAY + 1).result.current.state.entries[empties[0]]).toBe(0);
  });

  it("starts fresh when the saved game does not belong to this puzzle", () => {
    const tampered = enterDigit(createInitialState(puzzleId, 6), puzzle, first, 4);
    tampered.entries[puzzle.givens.findIndex((digit) => digit !== 0)] = 1;
    trailSudokuStorage.saveState(DAY, tampered);
    expect(renderSession().result.current.state.entries.every((entry) => entry === 0)).toBe(true);
  });

  it("selects nothing when every square is already filled", () => {
    const store = createMemoryStore();
    expect(trailSudokuStorage.saveState(DAY, createInitialState(puzzleId, 6), store)).toBe(true);
    const solved = createInitialState(puzzleId, 6);
    solved.entries = puzzle.solution.map((digit, index) =>
      puzzle.givens[index] === 0 ? digit : 0,
    );
    solved.status = "won";
    trailSudokuStorage.saveState(DAY, solved);
    expect(renderSession().result.current.selected).toBeNull();
  });

  it("uses the latest selection and notes mode even when keys arrive before the next render", () => {
    const session = renderSession();
    act(() => {
      session.result.current.select(second);
      session.result.current.toggleNotesMode();
      session.result.current.enter(3);
      session.result.current.enter(5);
    });
    expect(session.result.current.state.entries[second]).toBe(0);
    expect(session.result.current.state.notes[second]).toBe((1 << 2) | (1 << 4));
    expect(session.result.current.state.notes[first]).toBe(0);
  });
});
