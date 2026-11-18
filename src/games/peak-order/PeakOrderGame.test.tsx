import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { formatValue } from "./format";
import { SOLVED, WRONG_ORDERS, listNames, puzzle } from "./fixtures";
import { PeakOrderGame } from "./PeakOrderGame";

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

function readRows(): HTMLElement[] {
  return screen.getAllByRole("button", { name: /, position \d of 5/ });
}

function readOrder(): number[] {
  const names = listNames(SOLVED);
  return readRows().map((row) =>
    names.findIndex((name) => row.getAttribute("aria-label")?.startsWith(`${name},`)),
  );
}

function arrangeTo(target: readonly number[]) {
  target.forEach((item, position) => {
    const at = readOrder().indexOf(item);
    if (at !== position) {
      fireEvent.click(readRows()[at]);
      fireEvent.click(readRows()[position]);
    }
  });
}

function check() {
  fireEvent.click(screen.getByRole("button", { name: "Check order" }));
}

function checkOrder(target: readonly number[]) {
  arrangeTo(target);
  check();
}

function startGame() {
  const view = render(<PeakOrderGame />);
  dismissHelp();
  return view;
}

describe("PeakOrderGame", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-11-16T10:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("opens the how-to-play dialog for a first-time player and not again afterwards", () => {
    const first = render(<PeakOrderGame />);
    expect(findDialog("How to play")).toHaveAttribute("open");
    dismissHelp();
    expect(findDialog("How to play")).not.toHaveAttribute("open");
    first.unmount();
    render(<PeakOrderGame />);
    expect(findDialog("How to play")).not.toHaveAttribute("open");
  });

  it("starts with the prompt, the five items in the scrambled order and five checks", () => {
    startGame();
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent(
      /^Order these .+ from .+ to .+$/,
    );
    expect(readOrder()).toEqual([...puzzle.start]);
    expect(screen.getByText("5 checks left")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Check order" })).toBeEnabled();
  });

  it("moves an item with two taps: pick it up, then tap where it goes", () => {
    startGame();
    const item = puzzle.start[0];
    fireEvent.click(readRows()[0]);
    expect(readRows()[0]).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(readRows()[3]);
    expect(readOrder()[3]).toBe(item);
    expect(screen.getByRole("status")).toHaveTextContent(
      `${puzzle.items[item].name} moved to position 4 of 5.`,
    );
  });

  it("moves an item with the up and down buttons and keeps focus on the button", () => {
    startGame();
    const [, , third] = listNames(puzzle.start);
    fireEvent.click(screen.getByRole("button", { name: `Move ${third} up` }));
    expect(readOrder()[1]).toBe(puzzle.start[2]);
    expect(screen.getByRole("button", { name: `Move ${third} up` })).toHaveFocus();
  });

  it("moves a selected item with the arrow keys, and Escape lets go", () => {
    startGame();
    const item = puzzle.start[1];
    fireEvent.click(readRows()[1]);
    fireEvent.keyDown(readRows()[1], { key: "ArrowDown" });
    expect(readOrder()[2]).toBe(item);
    expect(readRows()[2]).toHaveFocus();
    expect(readRows()[2]).toHaveAttribute("aria-pressed", "true");
    fireEvent.keyDown(readRows()[2], { key: "Escape" });
    expect(readRows()[2]).toHaveAttribute("aria-pressed", "false");
  });

  it("tells how many are in the right place, and marks them until they are moved", () => {
    startGame();
    checkOrder([0, 1, 2, 4, 3]);
    expect(screen.getByRole("status")).toHaveTextContent("3 of 5 in the right place.");
    expect(screen.getAllByText("In place")).toHaveLength(3);
    expect(screen.getByText("4 checks left")).toBeInTheDocument();
    fireEvent.click(readRows()[3]);
    fireEvent.click(readRows()[4]);
    expect(screen.getAllByText("In place")).toHaveLength(3);
    fireEvent.click(readRows()[0]);
    fireEvent.click(readRows()[1]);
    expect(screen.getAllByText("In place")).toHaveLength(1);
  });

  it("does not let a check be wasted on an order that was just checked", () => {
    startGame();
    checkOrder(WRONG_ORDERS[0]);
    expect(screen.getByRole("button", { name: "Check order" })).toBeDisabled();
    fireEvent.click(readRows()[0]);
    fireEvent.click(readRows()[4]);
    expect(screen.getByRole("button", { name: "Check order" })).toBeEnabled();
    expect(screen.getByText("4 checks left")).toBeInTheDocument();
  });

  it("wins on the first check: 5 points, the real values and a share button", () => {
    startGame();
    checkOrder(SOLVED);
    expect(screen.getByRole("heading", { name: "You got it!" })).toBeInTheDocument();
    expect(screen.getByText("5 / 5 points")).toBeInTheDocument();
    expect(screen.getByText("Ordered in 1 check")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Share result" })).toBeInTheDocument();
    puzzle.items.forEach((item) => {
      expect(screen.getByText(formatValue(item.value, puzzle.category))).toBeInTheDocument();
    });
    expect(screen.queryByRole("button", { name: "Check order" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /, position \d of 5/ })).not.toBeInTheDocument();
  });

  it("scores fewer points for a later win", () => {
    startGame();
    checkOrder(WRONG_ORDERS[0]);
    checkOrder(WRONG_ORDERS[1]);
    checkOrder(SOLVED);
    expect(screen.getByText("3 / 5 points")).toBeInTheDocument();
    expect(screen.getByText("Ordered in 3 checks")).toBeInTheDocument();
  });

  it("loses after five wrong checks, and shows the right order with the values", () => {
    startGame();
    WRONG_ORDERS.forEach(checkOrder);
    expect(screen.getByRole("heading", { name: "Not this time" })).toBeInTheDocument();
    expect(screen.getByText("Out of checks")).toBeInTheDocument();
    expect(screen.getByText("Here is the right order")).toBeInTheDocument();
    const rows = screen.getAllByRole("group", { name: /position \d of 5/ });
    expect(rows.map((row) => row.getAttribute("aria-label"))).toEqual(
      puzzle.items.map(
        (item, position) =>
          `${item.name}, position ${position + 1} of 5, ${formatValue(item.value, puzzle.category)}`,
      ),
    );
    expect(screen.queryByRole("button", { name: "Check order" })).not.toBeInTheDocument();
  });

  it("shares the checks without giving anything away", () => {
    startGame();
    checkOrder(WRONG_ORDERS[0]);
    checkOrder(SOLVED);
    const preview = document.querySelector(".share-preview")?.textContent ?? "";
    expect(preview).toContain("Dailyverse Peak Order #1");
    expect(preview).toContain("2/5");
    expect(preview).toContain("🟩");
    puzzle.items.forEach((item) => expect(preview).not.toContain(item.name));
  });

  it("restores a game in progress, with its marks", () => {
    const first = startGame();
    checkOrder([0, 1, 2, 4, 3]);
    fireEvent.click(readRows()[3]);
    fireEvent.click(readRows()[4]);
    const order = readOrder();
    first.unmount();
    render(<PeakOrderGame />);
    expect(readOrder()).toEqual(order);
    expect(screen.getByText("4 checks left")).toBeInTheDocument();
    expect(screen.getAllByText("In place")).toHaveLength(3);
  });

  it("restores a finished game when the page is opened again", () => {
    const first = startGame();
    checkOrder(SOLVED);
    first.unmount();
    render(<PeakOrderGame />);
    expect(screen.getByRole("heading", { name: "You got it!" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Check order" })).not.toBeInTheDocument();
  });

  it("starts a new puzzle the next day", () => {
    const first = startGame();
    checkOrder(SOLVED);
    first.unmount();
    vi.setSystemTime(new Date("2026-11-17T10:00:00Z"));
    render(<PeakOrderGame />);
    expect(screen.queryByRole("heading", { name: "You got it!" })).not.toBeInTheDocument();
    expect(screen.getByText("5 checks left")).toBeInTheDocument();
  });

  it("records the result in the stats dialog", () => {
    startGame();
    checkOrder(SOLVED);
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

  it("works when a row is dragged to another place", () => {
    startGame();
    const item = puzzle.start[0];
    const data = new Map<string, string>();
    const dataTransfer = {
      setData: (type: string, value: string) => data.set(type, value),
      getData: (type: string) => data.get(type) ?? "",
      effectAllowed: "",
    };
    const rows = screen.getAllByRole("listitem");
    act(() => {
      fireEvent.dragStart(rows[0], { dataTransfer });
      fireEvent.drop(rows[2], { dataTransfer });
    });
    expect(readOrder()[2]).toBe(item);
  });
});
