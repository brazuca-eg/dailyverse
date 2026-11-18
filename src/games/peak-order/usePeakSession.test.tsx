import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { readStatus } from "./game";
import { SOLVED, WRONG_ORDERS, puzzle } from "./fixtures";
import { peakOrderStorage } from "./persistence";
import { usePeakSession } from "./usePeakSession";

const DAY = 0;

function renderSession(day = DAY) {
  return renderHook(() => usePeakSession(peakOrderStorage, puzzle, day));
}

type Session = ReturnType<typeof renderSession>;

function press(session: Session, position: number) {
  act(() => session.result.current.pressRow(position));
}

function arrangeTo(session: Session, target: readonly number[]) {
  target.forEach((item, position) => {
    const at = session.result.current.state.order.indexOf(item);
    if (at !== position) {
      press(session, at);
      press(session, position);
    }
  });
}

function checkOrder(session: Session, target: readonly number[]) {
  arrangeTo(session, target);
  act(() => session.result.current.check());
}

describe("usePeakSession", () => {
  it("starts from the puzzle's order, with nothing selected and no message", () => {
    const session = renderSession();
    expect(session.result.current.state.order).toEqual([...puzzle.start]);
    expect(session.result.current.state.history).toEqual([]);
    expect(session.result.current.selected).toBeNull();
    expect(session.result.current.notice).toBeNull();
  });

  it("selects a row with a first tap, and clears it with a tap on the same row", () => {
    const session = renderSession();
    press(session, 2);
    expect(session.result.current.selected).toBe(2);
    expect(session.result.current.notice).toContain(
      `${puzzle.items[puzzle.start[2]].name} selected`,
    );
    press(session, 2);
    expect(session.result.current.selected).toBeNull();
    expect(session.result.current.notice).toBe("Selection cleared.");
  });

  it("moves the selected item to the row that is tapped next", () => {
    const session = renderSession();
    const moved = puzzle.start[0];
    press(session, 0);
    press(session, 3);
    expect(session.result.current.state.order[3]).toBe(moved);
    expect(session.result.current.selected).toBeNull();
    expect(session.result.current.notice).toBe(
      `${puzzle.items[moved].name} moved to position 4 of 5.`,
    );
  });

  it("moves an item with the shift buttons, keeps focus on that button and follows a selection", () => {
    const session = renderSession();
    const item = puzzle.start[2];
    act(() => session.result.current.shift(2, -1, "up"));
    expect(session.result.current.state.order[1]).toBe(item);
    expect(session.result.current.focusRequest).toMatchObject({ item, target: "up" });
    press(session, 1);
    act(() => session.result.current.shift(1, 1, "row"));
    expect(session.result.current.selected).toBe(2);
    expect(session.result.current.state.order[2]).toBe(item);
  });

  it("asks for focus again after every move, even for the same item", () => {
    const session = renderSession();
    act(() => session.result.current.shift(2, -1, "up"));
    const first = session.result.current.focusRequest?.id;
    act(() => session.result.current.shift(1, 1, "down"));
    expect(session.result.current.focusRequest?.id).not.toBe(first);
  });

  it("does nothing when an item is moved past either end", () => {
    const session = renderSession();
    const before = session.result.current.state;
    act(() => session.result.current.shift(0, -1, "up"));
    act(() => session.result.current.shift(4, 1, "down"));
    expect(session.result.current.state).toBe(before);
    expect(session.result.current.focusRequest).toBeNull();
  });

  it("moves an item that is dropped on a row, and clears any selection", () => {
    const session = renderSession();
    press(session, 4);
    const item = puzzle.start[1];
    act(() => session.result.current.drop(1, 3));
    expect(session.result.current.state.order[3]).toBe(item);
    expect(session.result.current.selected).toBeNull();
  });

  it("can clear the selection", () => {
    const session = renderSession();
    press(session, 1);
    act(() => session.result.current.deselect());
    expect(session.result.current.selected).toBeNull();
  });

  it("saves the order after every move", () => {
    const session = renderSession();
    press(session, 0);
    press(session, 2);
    expect(peakOrderStorage.findSavedState(puzzle.id, DAY)?.order).toEqual(
      session.result.current.state.order,
    );
  });

  it("tells how many are in the right place after a check", () => {
    const none = renderSession();
    checkOrder(none, [1, 0, 3, 2, 4].slice(0, 0).concat([1, 2, 3, 4, 0]));
    expect(none.result.current.notice).toBe("None of them are in the right place yet.");
    const some = renderSession();
    checkOrder(some, WRONG_ORDERS[0]);
    expect(some.result.current.notice).toBe("1 of 5 in the right place.");
  });

  it("says so when everything is right", () => {
    const session = renderSession();
    checkOrder(session, SOLVED);
    expect(session.result.current.notice).toBe("Every item is in the right place.");
    expect(readStatus(session.result.current.state)).toBe("won");
  });

  it("does not use up a check when nothing has changed", () => {
    const session = renderSession();
    checkOrder(session, WRONG_ORDERS[0]);
    act(() => session.result.current.check());
    expect(session.result.current.state.history).toHaveLength(1);
  });

  it("restores the game when the page is opened again, for the same day only", () => {
    const first = renderSession();
    checkOrder(first, WRONG_ORDERS[0]);
    first.unmount();
    expect(renderSession().result.current.state.history).toEqual([WRONG_ORDERS[0]]);
    expect(renderSession(DAY + 1).result.current.state.history).toEqual([]);
  });

  it("records a win once", () => {
    const session = renderSession();
    checkOrder(session, WRONG_ORDERS[0]);
    expect(session.result.current.stats.gamesPlayed).toBe(0);
    checkOrder(session, SOLVED);
    expect(session.result.current.stats).toMatchObject({
      gamesPlayed: 1,
      gamesWon: 1,
      currentStreak: 1,
    });
    expect(peakOrderStorage.loadStats().gamesWon).toBe(1);
  });

  it("records a loss after five wrong checks", () => {
    const session = renderSession();
    WRONG_ORDERS.forEach((order) => checkOrder(session, order));
    expect(readStatus(session.result.current.state)).toBe("lost");
    expect(session.result.current.stats).toMatchObject({
      gamesPlayed: 1,
      gamesWon: 0,
      currentStreak: 0,
    });
  });

  it("ignores taps, moves, drops and checks once the game is over", () => {
    const session = renderSession();
    checkOrder(session, SOLVED);
    const finished = session.result.current.state;
    press(session, 0);
    act(() => session.result.current.shift(2, -1, "up"));
    act(() => session.result.current.drop(0, 3));
    act(() => session.result.current.check());
    expect(session.result.current.state).toBe(finished);
    expect(session.result.current.selected).toBeNull();
    expect(session.result.current.stats.gamesPlayed).toBe(1);
  });
});
