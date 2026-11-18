import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { countAdjacentBears, listStartCells } from "./counts";
import { buildDailyBearRound } from "./daily";
import { listSafeCells } from "./fixtures";
import { readNeighbours } from "./grid";
import { BearSweeperGame } from "./BearSweeperGame";

const round = buildDailyBearRound(0);
const { puzzle } = round;
const counts = countAdjacentBears(puzzle);
const clearing = new Set(listStartCells(puzzle));
const hiddenSafe = listSafeCells(puzzle).filter((index) => !clearing.has(index));
const numbered = hiddenSafe.find((index) => counts[index] > 0) as number;

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
  const view = render(<BearSweeperGame />);
  dismissHelp();
  return view;
}

function cell(index: number): HTMLElement {
  return document.querySelector<HTMLElement>(`[data-index="${index}"]`) as HTMLElement;
}

function hint() {
  fireEvent.click(screen.getByRole("button", { name: "Hint" }));
}

function winByHints() {
  Array.from({ length: puzzle.size ** 2 }).forEach(() => {
    if (screen.queryByRole("button", { name: "Hint" })) {
      hint();
    }
  });
}

function hitBears(count: number) {
  puzzle.bears.slice(0, count).forEach((bear) => fireEvent.click(cell(bear)));
}

describe("BearSweeperGame", () => {
  beforeEach(() => {
    vi.useFakeTimers({
      toFake: ["Date", "setInterval", "clearInterval", "setTimeout", "clearTimeout"],
    });
    vi.setSystemTime(new Date("2026-11-16T10:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows how to play on the first visit only", () => {
    const first = render(<BearSweeperGame />);
    expect(findDialog("How to play")).toHaveAttribute("open");
    dismissHelp();
    expect(findDialog("How to play")).not.toHaveAttribute("open");
    first.unmount();
    render(<BearSweeperGame />);
    expect(findDialog("How to play")).not.toHaveAttribute("open");
  });

  it("starts with an open clearing, three lives, every bear still to find and the clock at zero", () => {
    startGame();
    expect(screen.getAllByRole("gridcell")).toHaveLength(puzzle.size ** 2);
    expect(screen.getByRole("img", { name: "3 of 3 lives left" })).toBeInTheDocument();
    expect(screen.getByText(`Bears left: ${puzzle.bears.length}`)).toBeInTheDocument();
    expect(screen.getByRole("timer")).toHaveTextContent("⏱ 0:00");
    expect(cell(puzzle.start)).toHaveAccessibleName(expect.stringContaining("revealed"));
  });

  it("counts the seconds", () => {
    startGame();
    act(() => {
      vi.advanceTimersByTime(65_000);
    });
    expect(screen.getByRole("timer")).toHaveTextContent("⏱ 1:05");
  });

  it("opens a square when it is tapped", () => {
    startGame();
    fireEvent.click(cell(numbered));
    expect(cell(numbered)).toHaveAccessibleName(expect.stringContaining("revealed"));
  });

  it("flags in flag mode and shows the bears that are left", () => {
    startGame();
    fireEvent.click(screen.getByRole("button", { name: "Flag mode off" }));
    fireEvent.click(cell(numbered));
    expect(cell(numbered)).toHaveAccessibleName(expect.stringMatching(/, flagged$/));
    expect(screen.getByText(`Bears left: ${puzzle.bears.length - 1}`)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Flag mode on" }));
    fireEvent.click(cell(numbered));
    expect(cell(numbered)).toHaveAccessibleName(expect.stringMatching(/, flagged$/));
  });

  it("flags with the F key", () => {
    startGame();
    fireEvent.keyDown(cell(numbered), { key: "f" });
    expect(cell(numbered)).toHaveAccessibleName(expect.stringMatching(/, flagged$/));
  });

  it("opens the squares around a number when its flags match", () => {
    startGame();
    fireEvent.click(cell(numbered));
    const around = readNeighbours(puzzle.size)[numbered];
    around
      .filter((next) => puzzle.bears.includes(next))
      .forEach((bear) => fireEvent.keyDown(cell(bear), { key: "f" }));
    fireEvent.click(cell(numbered));
    around
      .filter((next) => !puzzle.bears.includes(next))
      .forEach((next) =>
        expect(cell(next)).toHaveAccessibleName(expect.stringContaining("revealed")),
      );
  });

  it("shows a bear, takes a life and says so", () => {
    startGame();
    hitBears(1);
    expect(cell(puzzle.bears[0])).toHaveAccessibleName(expect.stringMatching(/, bear$/));
    expect(screen.getByRole("img", { name: "2 of 3 lives left" })).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("A bear! 2 lives left.");
  });

  it("opens a square that a hint proves safe", () => {
    startGame();
    hint();
    const opened = Array.from(document.querySelectorAll("[data-index]")).filter((square) =>
      square.getAttribute("aria-label")?.includes("revealed"),
    );
    expect(opened.length).toBeGreaterThan(clearing.size);
  });

  it("wins when every safe square is open: 5 points less the hints, the time and a share button", () => {
    startGame();
    act(() => {
      vi.advanceTimersByTime(161_000);
    });
    winByHints();
    expect(screen.getByRole("heading", { name: "You got it!" })).toBeInTheDocument();
    expect(screen.getByText("1 / 5 points")).toBeInTheDocument();
    expect(screen.getByText("All clear in 2:41")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Share result" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Hint" })).not.toBeInTheDocument();
  });

  it("loses on the third bear and shows where every bear was", () => {
    startGame();
    hitBears(3);
    expect(screen.getByRole("heading", { name: "Not this time" })).toBeInTheDocument();
    expect(screen.getByText("Chased off")).toBeInTheDocument();
    expect(screen.getByText("Here is where the bears were")).toBeInTheDocument();
    puzzle.bears.forEach((bear) =>
      expect(cell(bear)).toHaveAccessibleName(expect.stringMatching(/, bear$/)),
    );
    expect(screen.queryByRole("button", { name: "Hint" })).not.toBeInTheDocument();
    expect(screen.getByRole("img", { name: "0 of 3 lives left" })).toBeInTheDocument();
  });

  it("gives up after two taps", () => {
    startGame();
    fireEvent.click(screen.getByRole("button", { name: "Give up" }));
    fireEvent.click(screen.getByRole("button", { name: "Tap again" }));
    expect(screen.getByRole("heading", { name: "Not this time" })).toBeInTheDocument();
  });

  it("restores a game in progress and a finished game", () => {
    const first = startGame();
    fireEvent.click(cell(numbered));
    hitBears(1);
    first.unmount();
    const second = render(<BearSweeperGame />);
    expect(cell(numbered)).toHaveAccessibleName(expect.stringContaining("revealed"));
    expect(screen.getByRole("img", { name: "2 of 3 lives left" })).toBeInTheDocument();
    winByHints();
    second.unmount();
    render(<BearSweeperGame />);
    expect(screen.getByRole("heading", { name: "You got it!" })).toBeInTheDocument();
  });

  it("starts a new puzzle the next day", () => {
    const first = startGame();
    winByHints();
    first.unmount();
    vi.setSystemTime(new Date("2026-11-17T10:00:00Z"));
    render(<BearSweeperGame />);
    expect(screen.queryByRole("heading", { name: "You got it!" })).not.toBeInTheDocument();
  });

  it("records the result in the stats dialog", () => {
    startGame();
    winByHints();
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

  it("shares the result without giving the bears away", () => {
    startGame();
    hitBears(1);
    winByHints();
    const preview = document.querySelector(".share-preview")?.textContent ?? "";
    expect(preview).toContain("Dailyverse Bear Sweeper #1");
    expect(preview).toContain("1 encounter");
    expect(preview).toContain("all clear");
  });

  it("shows an 11x11 board on hard days", () => {
    vi.setSystemTime(new Date("2026-11-18T10:00:00Z"));
    startGame();
    expect(screen.getAllByRole("gridcell")).toHaveLength(121);
  });
});
