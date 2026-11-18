import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { buildDailySudokuRound } from "./daily";
import { SudokuGame } from "./SudokuGame";

const round = buildDailySudokuRound(0);
const { puzzle } = round;
const empties = puzzle.givens
  .map((given, index) => (given === 0 ? index : -1))
  .filter((index) => index >= 0);

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

function startGame() {
  const view = render(<SudokuGame />);
  dismissHelp();
  return view;
}

function cell(index: number): HTMLElement {
  const row = Math.floor(index / puzzle.size) + 1;
  const col = (index % puzzle.size) + 1;
  return screen.getByRole("button", { name: new RegExp(`^Row ${row}, column ${col},`) });
}

function pressDigit(digit: number) {
  fireEvent.click(screen.getByRole("button", { name: new RegExp(`^${digit}, \\d+ left$`) }));
}

function enter(index: number, digit: number) {
  fireEvent.click(cell(index));
  pressDigit(digit);
}

function solveBoard() {
  empties.forEach((index) => enter(index, puzzle.solution[index]));
}

function wrongDigit(index: number): number {
  return (puzzle.solution[index] % puzzle.size) + 1;
}

describe("SudokuGame", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-16T10:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows how to play on the first visit only", () => {
    const first = render(<SudokuGame />);
    expect(findDialog("How to play")).toHaveAttribute("open");
    dismissHelp();
    expect(findDialog("How to play")).not.toHaveAttribute("open");
    first.unmount();
    render(<SudokuGame />);
    expect(findDialog("How to play")).not.toHaveAttribute("open");
  });

  it("starts with a board of the right size, the clock at zero and the tier named", () => {
    startGame();
    expect(screen.getAllByRole("gridcell")).toHaveLength(puzzle.size * puzzle.size);
    expect(screen.getByRole("timer")).toHaveTextContent("⏱ 0:00");
    expect(screen.getByText(`${puzzle.size}x${puzzle.size} · ${round.tier}`)).toBeInTheDocument();
  });

  it("counts the seconds", () => {
    startGame();
    act(() => {
      vi.advanceTimersByTime(65_000);
    });
    expect(screen.getByRole("timer")).toHaveTextContent("⏱ 1:05");
  });

  it("enters a number from the pad into the selected square", () => {
    startGame();
    enter(empties[1], 4);
    expect(cell(empties[1])).toHaveAccessibleName(expect.stringContaining("entered 4"));
  });

  it("enters a number from the keyboard and moves with the arrows", () => {
    startGame();
    fireEvent.click(cell(empties[0]));
    fireEvent.keyDown(cell(empties[0]), { key: "3" });
    expect(cell(empties[0])).toHaveAccessibleName(expect.stringContaining("entered 3"));
    fireEvent.keyDown(cell(empties[0]), { key: "Backspace" });
    expect(cell(empties[0])).toHaveAccessibleName(expect.stringContaining(", empty"));
    fireEvent.keyDown(cell(empties[0]), { key: "ArrowRight" });
    expect(cell(empties[0] + 1)).toHaveAttribute("aria-current", "true");
  });

  it("writes notes when notes are on, from the button or the N key", () => {
    startGame();
    fireEvent.click(cell(empties[0]));
    fireEvent.click(screen.getByRole("button", { name: "Notes off" }));
    pressDigit(2);
    pressDigit(5);
    expect(cell(empties[0])).toHaveAccessibleName(expect.stringContaining("notes 2 5"));
    fireEvent.keyDown(cell(empties[0]), { key: "n" });
    expect(screen.getByRole("button", { name: "Notes off" })).toBeInTheDocument();
  });

  it("marks a number that repeats in a row, column or box", () => {
    startGame();
    const row = Math.floor(empties[0] / puzzle.size);
    const peer = puzzle.givens.findIndex(
      (digit, index) => digit !== 0 && Math.floor(index / puzzle.size) === row,
    );
    enter(empties[0], puzzle.givens[peer]);
    expect(cell(empties[0])).toHaveAccessibleName(expect.stringContaining("clashes"));
    expect(cell(peer)).toHaveAccessibleName(expect.stringContaining("clashes"));
  });

  it("checks, marks wrong numbers and costs a point", () => {
    startGame();
    enter(empties[0], wrongDigit(empties[0]));
    fireEvent.click(screen.getByRole("button", { name: "Check" }));
    expect(screen.getByText("1 number is wrong. That cost a point.")).toBeInTheDocument();
    expect(cell(empties[0])).toHaveAccessibleName(expect.stringContaining("wrong"));
  });

  it("undoes the last move", () => {
    startGame();
    enter(empties[0], 4);
    fireEvent.click(screen.getByRole("button", { name: "Undo" }));
    expect(cell(empties[0])).toHaveAccessibleName(expect.stringContaining(", empty"));
  });

  it("fills a square with a hint", () => {
    startGame();
    fireEvent.click(cell(empties[2]));
    fireEvent.click(screen.getByRole("button", { name: "Hint" }));
    expect(cell(empties[2])).toHaveAccessibleName(
      expect.stringContaining(`entered ${puzzle.solution[empties[2]]}`),
    );
  });

  it("disables a number once every one of them is placed", () => {
    startGame();
    const digit = puzzle.solution[empties[0]];
    empties
      .filter((index) => puzzle.solution[index] === digit)
      .forEach((index) => enter(index, digit));
    expect(screen.getByRole("button", { name: `${digit}, 0 left` })).toBeDisabled();
  });

  it("wins when the grid is solved: 5 points, the time and a share button", () => {
    startGame();
    act(() => {
      vi.advanceTimersByTime(192_000);
    });
    solveBoard();
    expect(screen.getByRole("heading", { name: "You got it!" })).toBeInTheDocument();
    expect(screen.getByText("5 / 5 points")).toBeInTheDocument();
    expect(screen.getByText("Solved in 3:12")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Share result" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Check" })).not.toBeInTheDocument();
  });

  it("scores less after a check and a hint", () => {
    startGame();
    enter(empties[0], wrongDigit(empties[0]));
    fireEvent.click(screen.getByRole("button", { name: "Check" }));
    solveBoard();
    expect(screen.getByText("4 / 5 points")).toBeInTheDocument();
  });

  it("gives up after two taps and shows the solution", () => {
    startGame();
    fireEvent.click(screen.getByRole("button", { name: "Give up" }));
    fireEvent.click(screen.getByRole("button", { name: "Tap again" }));
    expect(screen.getByRole("heading", { name: "Not this time" })).toBeInTheDocument();
    expect(screen.getByText("Here is the solution")).toBeInTheDocument();
    expect(cell(empties[0])).toHaveTextContent(String(puzzle.solution[empties[0]]));
    expect(screen.queryByRole("button", { name: "Hint" })).not.toBeInTheDocument();
  });

  it("restores a game in progress and a finished game", () => {
    const first = startGame();
    enter(empties[0], 4);
    first.unmount();
    const second = render(<SudokuGame />);
    expect(cell(empties[0])).toHaveAccessibleName(expect.stringContaining("entered 4"));
    solveBoard();
    second.unmount();
    render(<SudokuGame />);
    expect(screen.getByRole("heading", { name: "You got it!" })).toBeInTheDocument();
  });

  it("starts a new puzzle the next day", () => {
    const first = startGame();
    solveBoard();
    first.unmount();
    vi.setSystemTime(new Date("2026-11-17T10:00:00Z"));
    render(<SudokuGame />);
    expect(screen.queryByRole("heading", { name: "You got it!" })).not.toBeInTheDocument();
  });

  it("records the result in the stats dialog", () => {
    startGame();
    solveBoard();
    fireEvent.click(screen.getByRole("button", { name: "Your stats" }));
    const dialog = findDialog("Your stats");
    expect(dialog).toHaveAttribute("open");
    expect(within(dialog).getByText("Played").nextElementSibling).toHaveTextContent("1");
    expect(within(dialog).getByText("Win rate").nextElementSibling).toHaveTextContent("100%");
  });

  it("reopens the help from the toolbar", () => {
    startGame();
    fireEvent.click(screen.getByRole("button", { name: "How to play" }));
    expect(findDialog("How to play")).toHaveAttribute("open");
  });

  it("shares the result without giving the puzzle away", () => {
    startGame();
    solveBoard();
    const preview = document.querySelector(".share-preview")?.textContent ?? "";
    expect(preview).toContain("Dailyverse Trail Sudoku #1");
    expect(preview).toContain("solved");
    expect(preview).toContain("0 hints");
  });

  it("shows a 9x9 board with nine numbers on hard days", () => {
    vi.setSystemTime(new Date("2026-11-18T10:00:00Z"));
    startGame();
    expect(screen.getAllByRole("gridcell")).toHaveLength(81);
    expect(screen.getByText("9x9 · hard")).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Numbers" }).children).toHaveLength(9);
  });
});
