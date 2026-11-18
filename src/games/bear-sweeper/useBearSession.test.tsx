import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { countAdjacentBears, listStartCells } from "./counts";
import { easyRound, listSafeCells } from "./fixtures";
import { readNeighbours } from "./grid";
import {
  FLAGGED,
  HIDDEN,
  REVEALED,
  TRIGGERED,
  buildPuzzleId,
  createInitialState,
  countEncounters,
} from "./game";
import { bearSweeperStorage } from "./persistence";
import { useBearSession } from "./useBearSession";

const { puzzle } = easyRound;
const puzzleId = buildPuzzleId(easyRound);
const counts = countAdjacentBears(puzzle);
const clearing = new Set(listStartCells(puzzle));
const hiddenSafe = listSafeCells(puzzle).filter((index) => !clearing.has(index));
const numbered = hiddenSafe.find((index) => counts[index] > 0) as number;
const [bearA, bearB, bearC] = puzzle.bears;
const DAY = 0;

function renderSession(day = DAY) {
  return renderHook(() => useBearSession(bearSweeperStorage, easyRound, day));
}

type Session = ReturnType<typeof renderSession>;

function run(session: Session, action: (current: Session["result"]["current"]) => void) {
  act(() => action(session.result.current));
}

describe("useBearSession", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("starts with the clearing open, flag mode off and no message", () => {
    const session = renderSession();
    expect(session.result.current.isFlagMode).toBe(false);
    expect(session.result.current.notice).toBeNull();
    expect(session.result.current.state.cells[puzzle.start]).toBe(REVEALED);
  });

  it("reveals a square when it is pressed, and saves it", () => {
    const session = renderSession();
    run(session, (current) => current.press(numbered));
    expect(session.result.current.state.cells[numbered]).toBe(REVEALED);
    expect(bearSweeperStorage.findSavedState(puzzleId, DAY)?.cells[numbered]).toBe(REVEALED);
  });

  it("flags instead of revealing in flag mode, and back again", () => {
    const session = renderSession();
    run(session, (current) => current.toggleFlagMode());
    expect(session.result.current.isFlagMode).toBe(true);
    run(session, (current) => current.press(numbered));
    expect(session.result.current.state.cells[numbered]).toBe(FLAGGED);
    run(session, (current) => current.press(numbered));
    expect(session.result.current.state.cells[numbered]).toBe(HIDDEN);
    run(session, (current) => current.toggleFlagMode());
    run(session, (current) => current.press(numbered));
    expect(session.result.current.state.cells[numbered]).toBe(REVEALED);
  });

  it("flags directly with the flag action", () => {
    const session = renderSession();
    run(session, (current) => current.flag(numbered));
    expect(session.result.current.state.cells[numbered]).toBe(FLAGGED);
  });

  it("does not reveal a flagged square when it is pressed", () => {
    const session = renderSession();
    run(session, (current) => current.flag(numbered));
    const before = session.result.current.state;
    run(session, (current) => current.press(numbered));
    expect(session.result.current.state).toBe(before);
  });

  it("opens the squares around a number when it is pressed with flags that match it", () => {
    const session = renderSession();
    const target = hiddenSafe.find((index) => counts[index] > 0) as number;
    run(session, (current) => current.press(target));
    const around = readNeighbours(puzzle.size)[target];
    const bearsAround = around.filter((cell) => puzzle.bears.includes(cell));
    bearsAround.forEach((bear) => run(session, (current) => current.flag(bear)));
    run(session, (current) => current.press(target));
    around
      .filter((cell) => !puzzle.bears.includes(cell))
      .forEach((cell) => expect(session.result.current.state.cells[cell]).toBe(REVEALED));
    expect(countEncounters(session.result.current.state)).toBe(0);
  });

  it("announces a bear, with the lives that are left", () => {
    const session = renderSession();
    run(session, (current) => current.press(bearA));
    expect(session.result.current.notice).toBe("A bear! 2 lives left.");
    run(session, (current) => current.press(bearB));
    expect(session.result.current.notice).toBe("A bear! 1 life left.");
  });

  it("loses on the third bear, announces it and records it once", () => {
    const session = renderSession();
    [bearA, bearB, bearC].forEach((bear) => run(session, (current) => current.press(bear)));
    expect(session.result.current.state.status).toBe("lost");
    expect(session.result.current.notice).toBe("The bears win this time.");
    expect(session.result.current.stats).toMatchObject({ gamesPlayed: 1, gamesWon: 0 });
    expect(countEncounters(session.result.current.state)).toBe(3);
  });

  it("wins with hints, announces it and records it once", () => {
    const session = renderSession();
    for (let step = 0; step < 200 && session.result.current.state.status === "playing"; step += 1) {
      run(session, (current) => current.hint());
    }
    expect(session.result.current.state.status).toBe("won");
    expect(session.result.current.notice).toBe("All clear! Every safe square is revealed.");
    expect(session.result.current.stats).toMatchObject({
      gamesPlayed: 1,
      gamesWon: 1,
      currentStreak: 1,
    });
    expect(bearSweeperStorage.loadStats().gamesWon).toBe(1);
  });

  it("ends the game when the player gives up, then takes no more input", () => {
    const session = renderSession();
    run(session, (current) => current.surrender());
    expect(session.result.current.state.status).toBe("lost");
    const finished = session.result.current.state;
    run(session, (current) => current.press(numbered));
    run(session, (current) => current.flag(numbered));
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
    run(first, (current) => current.press(numbered));
    first.unmount();
    expect(renderSession().result.current.state.cells[numbered]).toBe(REVEALED);
    expect(renderSession(DAY + 1).result.current.state.cells[numbered]).toBe(HIDDEN);
  });

  it("starts fresh when the saved game does not belong to this puzzle", () => {
    const tampered = createInitialState(puzzleId, puzzle);
    tampered.cells[bearA] = REVEALED;
    bearSweeperStorage.saveState(DAY, tampered);
    expect(renderSession().result.current.state.cells[bearA]).toBe(HIDDEN);
  });

  it("uses the latest flag mode even when presses arrive before the next render", () => {
    const session = renderSession();
    act(() => {
      session.result.current.toggleFlagMode();
      session.result.current.press(numbered);
    });
    expect(session.result.current.state.cells[numbered]).toBe(FLAGGED);
  });

  it("marks a bear that was met so it cannot be pressed again", () => {
    const session = renderSession();
    run(session, (current) => current.press(bearA));
    const before = session.result.current.state;
    expect(before.cells[bearA]).toBe(TRIGGERED);
    run(session, (current) => current.press(bearA));
    expect(session.result.current.state).toBe(before);
  });
});
