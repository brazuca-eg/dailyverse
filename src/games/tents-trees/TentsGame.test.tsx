import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { buildDailyRound } from "./daily";
import { TentsGame } from "./TentsGame";
import { toIndex } from "./rules";

const LAUNCH_DATE = new Date("2026-11-16T00:00:00Z");
const { puzzle } = buildDailyRound(0);
const { size } = puzzle;
const trees = new Set(puzzle.trees.map((tree) => toIndex(size, tree)));
const solution = puzzle.solution.map((tent) => toIndex(size, tent));
const spare = Array.from({ length: size * size }, (_, index) => index).filter(
  (index) => !trees.has(index) && !solution.includes(index),
);

function renderGame() {
  return render(<TentsGame launchDate={LAUNCH_DATE} />);
}

function cellAt(index: number): HTMLElement {
  const row = Math.floor(index / size) + 1;
  const col = (index % size) + 1;
  return screen.getByRole("button", { name: new RegExp(`^Row ${row}, column ${col},`) });
}

function tap(index: number) {
  fireEvent.pointerDown(cellAt(index), { button: 0 });
  fireEvent.pointerUp(cellAt(index), { button: 0 });
}

function solveBoard() {
  solution.forEach(tap);
}

function press(name: string) {
  fireEvent.click(screen.getByRole("button", { name }));
}

function findDialog(title: string): HTMLElement {
  const dialog = screen.getByRole("heading", { name: title, hidden: true }).closest("dialog");
  if (!dialog) {
    throw new Error(`No dialog titled ${title}`);
  }
  return dialog;
}

function dismissHelp() {
  fireEvent.click(screen.getByRole("button", { name: "Start playing" }));
}

function readLabel(index: number): string {
  return cellAt(index).getAttribute("aria-label") ?? "";
}

describe("TentsGame", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-16T10:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows how to play on the first visit only", () => {
    const first = renderGame();
    expect(findDialog("How to play")).toHaveAttribute("open");
    dismissHelp();
    expect(findDialog("How to play")).not.toHaveAttribute("open");
    first.unmount();
    renderGame();
    expect(findDialog("How to play")).not.toHaveAttribute("open");
  });

  it("starts with an empty board, the clock running and no tents placed", () => {
    renderGame();
    dismissHelp();
    expect(screen.getAllByText(`0 of ${puzzle.trees.length} tents placed`).length).toBeGreaterThan(
      0,
    );
    expect(screen.getByRole("timer")).toHaveTextContent("⏱ 0:00");
    expect(screen.getByRole("grid")).toBeInTheDocument();
    solution.forEach((index) => expect(readLabel(index)).toMatch(/empty$/));
  });

  it("counts the seconds", () => {
    renderGame();
    dismissHelp();
    act(() => {
      vi.advanceTimersByTime(65_000);
    });
    expect(screen.getByRole("timer")).toHaveTextContent("⏱ 1:05");
  });

  it("places a tent on a tap and cycles to grass and back to empty", () => {
    renderGame();
    dismissHelp();
    tap(spare[0]);
    expect(readLabel(spare[0])).toMatch(/tent/);
    tap(spare[0]);
    expect(readLabel(spare[0])).toMatch(/grass$/);
    tap(spare[0]);
    expect(readLabel(spare[0])).toMatch(/empty$/);
  });

  it("counts the tents placed", () => {
    renderGame();
    dismissHelp();
    tap(solution[0]);
    tap(solution[1]);
    expect(screen.getAllByText(`2 of ${puzzle.trees.length} tents placed`).length).toBeGreaterThan(
      0,
    );
  });

  it("wins with the right tents: result, full score, share text and no more controls", () => {
    renderGame();
    dismissHelp();
    solveBoard();
    expect(screen.getByRole("heading", { name: "You got it!" })).toBeInTheDocument();
    expect(screen.getByText(`You pitched all ${puzzle.trees.length} tents`)).toBeInTheDocument();
    expect(screen.getByText("5 / 5 points")).toBeInTheDocument();
    expect(screen.getByText(/Dailyverse Tents and Trees #1 6x6/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Check" })).not.toBeInTheDocument();
  });

  it("shows a conflict at once for two tents that touch", () => {
    renderGame();
    dismissHelp();
    const pair = spare.find(
      (index) => index % size < size - 1 && spare.includes(index + 1),
    ) as number;
    tap(pair);
    tap(pair + 1);
    expect(readLabel(pair)).toMatch(/conflict$/);
    expect(readLabel(pair + 1)).toMatch(/conflict$/);
  });

  it("tells how many marks are wrong and costs a point, without saying which", () => {
    renderGame();
    dismissHelp();
    tap(spare[0]);
    press("Check");
    expect(screen.getByText("1 mark is wrong. That cost a point.")).toBeInTheDocument();
    solution.forEach((index) => expect(readLabel(index)).not.toMatch(/answer/));
    tap(spare[0]);
    tap(spare[0]);
    solveBoard();
    expect(screen.getByText("4 / 5 points")).toBeInTheDocument();
  });

  it("says everything is right when it is, for free", () => {
    renderGame();
    dismissHelp();
    tap(solution[0]);
    press("Check");
    expect(screen.getByText("Everything so far is right.")).toBeInTheDocument();
    solution.slice(1).forEach(tap);
    expect(screen.getByText("5 / 5 points")).toBeInTheDocument();
  });

  it("places a tent for a hint and costs a point", () => {
    renderGame();
    dismissHelp();
    press("Hint");
    expect(readLabel(solution[0])).toMatch(/tent/);
    solution.slice(1).forEach(tap);
    expect(screen.getByText("4 / 5 points")).toBeInTheDocument();
    expect(screen.getByText(/💡 1 hint/)).toBeInTheDocument();
  });

  it("undoes the last change", () => {
    renderGame();
    dismissHelp();
    tap(spare[0]);
    press("Undo");
    expect(readLabel(spare[0])).toMatch(/empty$/);
    expect(screen.getByRole("button", { name: "Undo" })).toBeDisabled();
  });

  it("clears the board only after a second tap", () => {
    renderGame();
    dismissHelp();
    tap(spare[0]);
    press("Clear");
    expect(readLabel(spare[0])).toMatch(/tent/);
    press("Tap again");
    expect(readLabel(spare[0])).toMatch(/empty$/);
  });

  it("gives up only after a second tap, then shows where the tents were", () => {
    const { container } = renderGame();
    dismissHelp();
    press("Give up");
    expect(screen.queryByRole("heading", { name: "Not this time" })).not.toBeInTheDocument();
    press("Tap again");
    expect(screen.getByRole("heading", { name: "Not this time" })).toBeInTheDocument();
    expect(screen.getByText("Gave up")).toBeInTheDocument();
    expect(screen.getByText("Here is where the tents were")).toBeInTheDocument();
    expect(screen.getByText("0 / 5 points")).toBeInTheDocument();
    expect(container.querySelectorAll(".cell-answer")).toHaveLength(solution.length);
    expect(screen.getByText(/gave up/)).toBeInTheDocument();
  });

  it("stops the clock and ignores taps once the round is over", () => {
    renderGame();
    dismissHelp();
    solveBoard();
    const time = screen.getByText(/^⏱/).textContent;
    tap(spare[0]);
    act(() => {
      vi.advanceTimersByTime(10_000);
    });
    expect(readLabel(spare[0])).toMatch(/empty$/);
    expect(screen.getByText(/^⏱/).textContent).toBe(time);
  });

  it("restores a round in progress, with its time", () => {
    const first = renderGame();
    dismissHelp();
    tap(spare[0]);
    act(() => {
      vi.advanceTimersByTime(7000);
    });
    first.unmount();
    renderGame();
    expect(readLabel(spare[0])).toMatch(/tent/);
    expect(screen.getByRole("timer")).toHaveTextContent("⏱ 0:07");
  });

  it("restores a finished round after a reload", () => {
    const first = renderGame();
    dismissHelp();
    solveBoard();
    first.unmount();
    renderGame();
    expect(screen.getByRole("heading", { name: "You got it!" })).toBeInTheDocument();
  });

  it("does not interrupt a player who has started with the how-to-play dialog", () => {
    const first = renderGame();
    dismissHelp();
    tap(spare[0]);
    first.unmount();
    localStorage.removeItem("dailyverse:tents-trees:help-seen");
    renderGame();
    expect(findDialog("How to play")).not.toHaveAttribute("open");
  });

  it("records the result in its own stats", () => {
    renderGame();
    dismissHelp();
    solveBoard();
    fireEvent.click(screen.getByRole("button", { name: "Your stats" }));
    const dialog = findDialog("Your stats");
    expect(within(dialog).getByText("Played").nextElementSibling).toHaveTextContent("1");
    expect(within(dialog).getByText("Win rate").nextElementSibling).toHaveTextContent("100%");
    expect(localStorage.getItem("dailyverse:tents-trees:stats")).not.toBeNull();
    expect(localStorage.getItem("dailyverse:spot-difference:stats")).toBeNull();
  });

  it("shows a new puzzle the next day", () => {
    const first = renderGame();
    dismissHelp();
    solveBoard();
    first.unmount();
    vi.setSystemTime(new Date("2026-11-17T10:00:00Z"));
    renderGame();
    expect(screen.queryByRole("heading", { name: "You got it!" })).not.toBeInTheDocument();
    expect(screen.getByRole("timer")).toHaveTextContent("⏱ 0:00");
  });

  it("explains the rules and the keyboard controls in the how-to-play dialog", () => {
    renderGame();
    const dialog = findDialog("How to play");
    expect(within(dialog).getByText(/never diagonally/)).toBeInTheDocument();
    expect(within(dialog).getByText(/arrow keys/)).toBeInTheDocument();
  });

  it("can be played with the keyboard alone", () => {
    renderGame();
    dismissHelp();
    const first = cellAt(0);
    first.focus();
    fireEvent.keyDown(first, { key: "ArrowDown" });
    expect(cellAt(size)).toHaveFocus();
    fireEvent.keyDown(cellAt(size), { key: "g" });
    expect(readLabel(size)).toMatch(/grass$/);
    fireEvent.keyDown(cellAt(size), { key: "Backspace" });
    expect(readLabel(size)).toMatch(/empty$/);
  });
});
