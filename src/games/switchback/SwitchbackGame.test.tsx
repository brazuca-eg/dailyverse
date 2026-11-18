import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { buildDailySwitchbackRound } from "./daily";
import { listDirections } from "./fixtures";
import { SwitchbackGame } from "./SwitchbackGame";

const round = buildDailySwitchbackRound(0);
const { puzzle, solution } = round;

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
  const view = render(<SwitchbackGame />);
  dismissHelp();
  return view;
}

function cell(index: number): HTMLElement {
  return document.querySelector<HTMLElement>(`[data-index="${index}"]`) as HTMLElement;
}

function headCell(): HTMLElement {
  return document.querySelector<HTMLElement>('.sw-cell[tabindex="0"]') as HTMLElement;
}

function walk(steps: number, from = 0) {
  listDirections(puzzle.size, solution)
    .slice(from, steps)
    .forEach((key) => fireEvent.keyDown(headCell(), { key }));
}

function solveBoard() {
  walk(solution.length - 1);
}

describe("SwitchbackGame", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-16T10:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows how to play on the first visit only", () => {
    const first = render(<SwitchbackGame />);
    expect(findDialog("How to play")).toHaveAttribute("open");
    dismissHelp();
    expect(findDialog("How to play")).not.toHaveAttribute("open");
    first.unmount();
    render(<SwitchbackGame />);
    expect(findDialog("How to play")).not.toHaveAttribute("open");
  });

  it("starts with the board, the size and tier named, the clock at zero and the start covered", () => {
    startGame();
    expect(screen.getAllByRole("button", { name: /^Row \d+, column \d+/ })).toHaveLength(
      puzzle.size ** 2,
    );
    expect(screen.getByText(`${puzzle.size}x${puzzle.size} · ${round.tier}`)).toBeInTheDocument();
    expect(screen.getByRole("timer")).toHaveTextContent("⏱ 0:00");
    expect(
      screen.getByText(
        new RegExp(`^1 of ${puzzle.size ** 2} squares · checkpoint 1 of ${puzzle.marks.length}`),
      ),
    ).toBeInTheDocument();
  });

  it("counts the seconds", () => {
    startGame();
    act(() => {
      vi.advanceTimersByTime(65_000);
    });
    expect(screen.getByRole("timer")).toHaveTextContent("⏱ 1:05");
  });

  it("extends the trail with the arrow keys and shows the progress", () => {
    startGame();
    walk(4);
    expect(screen.getByText(new RegExp(`^5 of ${puzzle.size ** 2} squares`))).toBeInTheDocument();
    expect(cell(solution[4])).toHaveAccessibleName(expect.stringContaining("end of your trail"));
  });

  it("extends the trail by pressing the next square", () => {
    startGame();
    fireEvent.pointerDown(cell(solution[1]), { button: 0 });
    fireEvent.pointerUp(cell(solution[1]));
    expect(cell(solution[1])).toHaveAccessibleName(expect.stringContaining("end of your trail"));
  });

  it("announces a checkpoint when it is reached", () => {
    startGame();
    walk(solution.indexOf(puzzle.marks[1]));
    expect(screen.getByRole("status")).toHaveTextContent("Checkpoint 2 reached.");
  });

  it("will not enter a square the rules forbid", () => {
    startGame();
    fireEvent.pointerDown(cell(solution[solution.length - 1]), { button: 0 });
    expect(screen.getByText(new RegExp(`^1 of ${puzzle.size ** 2} squares`))).toBeInTheDocument();
  });

  it("undoes a step", () => {
    startGame();
    walk(3);
    fireEvent.click(screen.getByRole("button", { name: "Undo" }));
    expect(screen.getByText(new RegExp(`^3 of ${puzzle.size ** 2} squares`))).toBeInTheDocument();
  });

  it("starts again after a second tap on Reset", () => {
    startGame();
    walk(5);
    fireEvent.click(screen.getByRole("button", { name: "Reset" }));
    fireEvent.click(screen.getByRole("button", { name: "Tap again" }));
    expect(screen.getByText(new RegExp(`^1 of ${puzzle.size ** 2} squares`))).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Trail cleared.");
  });

  it("corrects the trail with a hint and costs a point", () => {
    startGame();
    fireEvent.click(screen.getByRole("button", { name: "Hint" }));
    expect(screen.getByText(new RegExp(`^2 of ${puzzle.size ** 2} squares`))).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Your trail was corrected one step.");
    walk(solution.length - 1, 1);
    expect(screen.getByText("4 / 5 points")).toBeInTheDocument();
  });

  it("wins at the summit: 5 points, the time and a share button", () => {
    startGame();
    act(() => {
      vi.advanceTimersByTime(72_000);
    });
    solveBoard();
    expect(screen.getByRole("heading", { name: "You got it!" })).toBeInTheDocument();
    expect(screen.getByText("5 / 5 points")).toBeInTheDocument();
    expect(screen.getByText("Summit reached in 1:12")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Share result" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Hint" })).not.toBeInTheDocument();
    screen
      .getAllByRole("button", { name: /^Row \d+, column \d+/ })
      .forEach((square) => expect(square).toBeDisabled());
  });

  it("gives up after two taps and shows the route", () => {
    startGame();
    fireEvent.click(screen.getByRole("button", { name: "Give up" }));
    fireEvent.click(screen.getByRole("button", { name: "Tap again" }));
    expect(screen.getByRole("heading", { name: "Not this time" })).toBeInTheDocument();
    expect(screen.getByText("Here is the route")).toBeInTheDocument();
    expect(document.querySelector(".sw-answer")).toBeInTheDocument();
  });

  it("restores a game in progress and a finished game", () => {
    const first = startGame();
    walk(6);
    first.unmount();
    const second = render(<SwitchbackGame />);
    expect(screen.getByText(new RegExp(`^7 of ${puzzle.size ** 2} squares`))).toBeInTheDocument();
    walk(solution.length - 1, 6);
    second.unmount();
    render(<SwitchbackGame />);
    expect(screen.getByRole("heading", { name: "You got it!" })).toBeInTheDocument();
  });

  it("starts a new puzzle the next day", () => {
    const first = startGame();
    solveBoard();
    first.unmount();
    vi.setSystemTime(new Date("2026-11-17T10:00:00Z"));
    render(<SwitchbackGame />);
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

  it("shares the result without giving the route away", () => {
    startGame();
    solveBoard();
    const preview = document.querySelector(".share-preview")?.textContent ?? "";
    expect(preview).toContain("Dailyverse Switchback #1");
    expect(preview).toContain("summit reached");
    expect(preview).toContain("0 hints");
  });

  it("shows a 7x7 board on hard days", () => {
    vi.setSystemTime(new Date("2026-11-18T10:00:00Z"));
    startGame();
    expect(screen.getAllByRole("button", { name: /^Row \d+, column \d+/ })).toHaveLength(49);
    expect(screen.getByText("7x7 · hard")).toBeInTheDocument();
  });
});
