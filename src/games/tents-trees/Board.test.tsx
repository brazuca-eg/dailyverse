import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { analyse, createInitialState, cycleCell, GRASS, TENT } from "./game";
import { generateTentsPuzzle } from "./generator";
import { Board } from "./Board";
import { toIndex } from "./rules";

const puzzle = generateTentsPuzzle(3, "easy");
const { size } = puzzle;
const trees = puzzle.trees.map((tree) => toIndex(size, tree));
const solution = puzzle.solution.map((tent) => toIndex(size, tent));
const free = Array.from({ length: size * size }, (_, index) => index).filter(
  (index) => !trees.includes(index) && !solution.includes(index),
);

type Props = Partial<Parameters<typeof Board>[0]>;

function marksWith(entries: readonly [number, number][]): number[] {
  const marks = createInitialState("x", size).marks;
  entries.forEach(([index, value]) => {
    marks[index] = value;
  });
  return marks;
}

function renderBoard(props: Props = {}) {
  const handlers = { onCycle: vi.fn(), onPaint: vi.fn(), onUndo: vi.fn() };
  const marks = props.marks ?? marksWith([]);
  const view = render(
    <Board
      puzzle={puzzle}
      marks={marks}
      analysis={analyse(puzzle, marks)}
      revealSolution={false}
      {...handlers}
      {...props}
    />,
  );
  return { ...handlers, ...view };
}

function cellAt(index: number): HTMLElement {
  const row = Math.floor(index / size) + 1;
  const col = (index % size) + 1;
  return screen.getByRole("button", { name: new RegExp(`^Row ${row}, column ${col},`) });
}

function press(index: number) {
  fireEvent.pointerDown(cellAt(index), { button: 0 });
}

function release(index: number) {
  fireEvent.pointerUp(cellAt(index), { button: 0 });
}

function moveOver(index: number) {
  const target = cellAt(index);
  document.elementFromPoint = vi.fn(() => target);
  fireEvent.pointerMove(target, { clientX: 1, clientY: 1 });
}

describe("Board layout and labels", () => {
  it("is a grid named with its size", () => {
    renderBoard();
    expect(
      screen.getByRole("grid", { name: `Tents and trees board, ${size} by ${size}` }),
    ).toBeInTheDocument();
  });

  it("has a button for every square, labelled with its place and what it holds", () => {
    renderBoard({
      marks: marksWith([
        [solution[0], TENT],
        [free[1], GRASS],
      ]),
    });
    expect(screen.getAllByRole("button")).toHaveLength(size * size);
    expect(screen.getByRole("button", { name: /^Row 1, column 1, / })).toBeInTheDocument();
    const description = (index: number) => cellAt(index).getAttribute("aria-label");
    expect(description(trees[0])).toMatch(/tree$/);
    expect(description(solution[0])).toMatch(/tent$/);
    expect(description(free[1])).toMatch(/grass$/);
    expect(description(free[2])).toMatch(/empty$/);
  });

  it("shows the target for every row and column, with its state for screen readers", () => {
    renderBoard();
    puzzle.rowCounts.forEach((target, row) => {
      const header = screen.getByRole("rowheader", {
        name: new RegExp(`^Row ${row + 1}: ${target} tents?,`),
      });
      expect(header).toBeInTheDocument();
    });
    puzzle.colCounts.forEach((target, col) => {
      expect(
        screen.getByRole("columnheader", {
          name: new RegExp(`^Column ${col + 1}: ${target} tents?,`),
        }),
      ).toBeInTheDocument();
    });
  });

  it("marks a line that has its count as done and one with too many tents", () => {
    const rowWithTent = puzzle.solution[0].row;
    const marks = marksWith(
      puzzle.solution
        .filter((tent) => tent.row === rowWithTent)
        .map((tent): [number, number] => [toIndex(size, tent), TENT]),
    );
    renderBoard({ marks });
    expect(
      screen.getByRole("rowheader", { name: new RegExp(`^Row ${rowWithTent + 1}:.*done`) }),
    ).toHaveClass("line-met");
  });

  it("flags a line that holds too many tents", () => {
    const emptyRow = puzzle.rowCounts.findIndex((count) => count === 0);
    const cell = Array.from({ length: size }, (_, col) => emptyRow * size + col).find(
      (index) => !trees.includes(index),
    ) as number;
    renderBoard({ marks: marksWith([[cell, TENT]]) });
    expect(
      screen.getByRole("rowheader", { name: new RegExp(`^Row ${emptyRow + 1}:.*too many`) }),
    ).toHaveClass("line-over");
  });

  it("flags a tent that has no tree beside it", () => {
    const hasTreeBeside = (index: number) =>
      [-size, size, -1, 1].some((step, position) => {
        const next = index + step;
        const sideways = position >= 2;
        const sameRow = Math.floor(next / size) === Math.floor(index / size);
        return next >= 0 && next < size * size && (!sideways || sameRow) && trees.includes(next);
      });
    const lonely = free.find((index) => !hasTreeBeside(index)) as number;
    renderBoard({ marks: marksWith([[lonely, TENT]]) });
    expect(cellAt(lonely)).toHaveClass("cell-clash");
    expect(cellAt(lonely).getAttribute("aria-label")).toMatch(/conflict$/);
  });

  it("flags two tents that touch", () => {
    const pair = free.find(
      (index) => index % size < size - 1 && free.includes(index + 1),
    ) as number;
    renderBoard({
      marks: marksWith([
        [pair, TENT],
        [pair + 1, TENT],
      ]),
    });
    expect(cellAt(pair)).toHaveClass("cell-clash");
    expect(cellAt(pair + 1)).toHaveClass("cell-clash");
  });

  it("shows no answers by default and shows missing tents when asked", () => {
    const { container, unmount } = renderBoard();
    expect(container.querySelectorAll(".cell-answer")).toHaveLength(0);
    unmount();
    const revealed = renderBoard({ revealSolution: true });
    expect(revealed.container.querySelectorAll(".cell-answer")).toHaveLength(solution.length);
    expect(cellAt(solution[0]).getAttribute("aria-label")).toMatch(/tent \(answer\)$/);
  });

  it("does not show an answer for a square that already holds a tent", () => {
    const { container } = renderBoard({
      revealSolution: true,
      marks: marksWith([[solution[0], TENT]]),
    });
    expect(container.querySelectorAll(".cell-answer")).toHaveLength(solution.length - 1);
  });

  it("draws a piece for trees, tents and grass", () => {
    renderBoard({
      marks: marksWith([
        [free[0], TENT],
        [free[1], GRASS],
      ]),
    });
    expect(cellAt(trees[0]).querySelector("svg")).not.toBeNull();
    expect(cellAt(free[0]).querySelector("svg")).not.toBeNull();
    expect(cellAt(free[1]).querySelector("svg")).not.toBeNull();
    expect(cellAt(free[2]).querySelector("svg")).toBeNull();
  });
});

describe("Board semantics and styling", () => {
  it("tells assistive technology that tree squares do nothing, but keeps them in the grid", () => {
    renderBoard();
    trees.forEach((index) => {
      expect(cellAt(index)).toHaveAttribute("aria-disabled", "true");
    });
    [free[0], solution[0]].forEach((index) => {
      expect(cellAt(index)).not.toHaveAttribute("aria-disabled");
    });
  });

  it("can still move focus onto a tree square", () => {
    renderBoard();
    const start = cellAt(0);
    start.focus();
    const tree = trees[0];
    cellAt(tree).focus();
    expect(cellAt(tree)).toHaveFocus();
  });

  it("uses the accessible tokens for the done count and the square borders", () => {
    const css = readFileSync(resolve("src/games/tents-trees/Board.css"), "utf8");
    expect(css).toMatch(/\.line-met\s*{[^}]*color:\s*var\(--success-text\)/);
    expect(css).toMatch(/\.cell\s*{[^}]*border:\s*1px solid var\(--cell-edge\)/);
  });
});

describe("Board taps and drags", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("cycles a square on a quick tap, once", () => {
    const { onCycle, onPaint } = renderBoard();
    press(free[0]);
    release(free[0]);
    expect(onCycle).toHaveBeenCalledTimes(1);
    expect(onCycle).toHaveBeenCalledWith(free[0]);
    expect(onPaint).not.toHaveBeenCalled();
  });

  it("paints grass instead of cycling when the pointer moves to another square", () => {
    const { onCycle, onPaint } = renderBoard();
    press(free[0]);
    moveOver(free[1]);
    release(free[1]);
    expect(onPaint).toHaveBeenCalledWith([free[0], free[1]]);
    expect(onCycle).not.toHaveBeenCalled();
  });

  it("keeps painting each new square the pointer enters, and not the same one twice", () => {
    const { onPaint } = renderBoard();
    press(free[0]);
    moveOver(free[1]);
    moveOver(free[1]);
    moveOver(free[2]);
    expect(onPaint).toHaveBeenNthCalledWith(1, [free[0], free[1]]);
    expect(onPaint).toHaveBeenNthCalledWith(2, [free[2]]);
    expect(onPaint).toHaveBeenCalledTimes(2);
  });

  it("does not look up the square under the pointer when no drag is going on", () => {
    renderBoard();
    const spy = vi.fn(() => cellAt(free[1]));
    document.elementFromPoint = spy;
    fireEvent.pointerMove(cellAt(free[0]), { clientX: 1, clientY: 1 });
    fireEvent.pointerMove(cellAt(free[1]), { clientX: 2, clientY: 2 });
    expect(spy).not.toHaveBeenCalled();
  });

  it("ignores movement when no drag started", () => {
    const { onPaint } = renderBoard();
    moveOver(free[1]);
    expect(onPaint).not.toHaveBeenCalled();
  });

  it("ignores movement over something that is not a square", () => {
    const { onPaint } = renderBoard();
    press(free[0]);
    document.elementFromPoint = vi.fn(() => document.body);
    fireEvent.pointerMove(cellAt(free[1]), { clientX: 1, clientY: 1 });
    expect(onPaint).not.toHaveBeenCalled();
  });

  it("does not start a drag from a right click", () => {
    const { onCycle } = renderBoard();
    fireEvent.pointerDown(cellAt(free[0]), { button: 2 });
    release(free[0]);
    expect(onCycle).not.toHaveBeenCalled();
  });

  it("forgets a drag that was cancelled", () => {
    const { onCycle, onPaint } = renderBoard();
    press(free[0]);
    fireEvent.pointerCancel(cellAt(free[0]));
    moveOver(free[1]);
    release(free[0]);
    expect(onPaint).not.toHaveBeenCalled();
    expect(onCycle).not.toHaveBeenCalled();
  });

  it("does not cycle again after a finished drag", () => {
    const { onCycle } = renderBoard();
    press(free[0]);
    moveOver(free[1]);
    release(free[1]);
    release(free[1]);
    expect(onCycle).not.toHaveBeenCalled();
  });
});

describe("Board keyboard", () => {
  it("has one tab stop, which follows the last square used", () => {
    renderBoard();
    expect(screen.getAllByRole("button").filter((button) => button.tabIndex === 0)).toHaveLength(1);
    press(free[2]);
    release(free[2]);
    expect(cellAt(free[2]).tabIndex).toBe(0);
    expect(cellAt(free[0]).tabIndex).toBe(-1);
  });

  it("moves focus with the arrow keys", () => {
    renderBoard();
    const start = cellAt(0);
    start.focus();
    fireEvent.keyDown(start, { key: "ArrowRight" });
    expect(cellAt(1)).toHaveFocus();
    fireEvent.keyDown(cellAt(1), { key: "ArrowDown" });
    expect(cellAt(size + 1)).toHaveFocus();
    fireEvent.keyDown(cellAt(size + 1), { key: "ArrowLeft" });
    fireEvent.keyDown(cellAt(size), { key: "ArrowUp" });
    expect(cellAt(0)).toHaveFocus();
  });

  it("stops at the edges instead of wrapping", () => {
    renderBoard();
    const corner = cellAt(0);
    corner.focus();
    fireEvent.keyDown(corner, { key: "ArrowLeft" });
    fireEvent.keyDown(corner, { key: "ArrowUp" });
    expect(corner).toHaveFocus();
    const last = cellAt(size * size - 1);
    last.focus();
    fireEvent.keyDown(last, { key: "ArrowRight" });
    fireEvent.keyDown(last, { key: "ArrowDown" });
    expect(last).toHaveFocus();
  });

  it("cycles the focused square with Enter or Space", () => {
    const { onCycle } = renderBoard();
    fireEvent.keyDown(cellAt(free[0]), { key: "Enter" });
    fireEvent.keyDown(cellAt(free[1]), { key: " " });
    expect(onCycle).toHaveBeenNthCalledWith(1, free[0]);
    expect(onCycle).toHaveBeenNthCalledWith(2, free[1]);
  });

  it("paints grass with G, in either case", () => {
    const { onPaint } = renderBoard();
    fireEvent.keyDown(cellAt(free[0]), { key: "g" });
    fireEvent.keyDown(cellAt(free[1]), { key: "G" });
    expect(onPaint).toHaveBeenNthCalledWith(1, [free[0]]);
    expect(onPaint).toHaveBeenNthCalledWith(2, [free[1]]);
  });

  it("undoes with Backspace", () => {
    const { onUndo } = renderBoard();
    fireEvent.keyDown(cellAt(free[0]), { key: "Backspace" });
    expect(onUndo).toHaveBeenCalledTimes(1);
  });

  it("stops the page from scrolling or acting on the keys it uses, and leaves the rest alone", () => {
    renderBoard();
    const cell = cellAt(free[0]);
    ["ArrowRight", "Enter", " ", "g", "Backspace"].forEach((key) => {
      expect(fireEvent.keyDown(cell, { key })).toBe(false);
    });
    expect(fireEvent.keyDown(cell, { key: "Tab" })).toBe(true);
    expect(fireEvent.keyDown(cell, { key: "x" })).toBe(true);
  });

  it("reads a finished tent in the label after cycling", () => {
    const state = cycleCell(createInitialState("x", size), puzzle, free[0]);
    renderBoard({ marks: state.marks });
    expect(cellAt(free[0]).getAttribute("aria-label")).toMatch(/tent/);
  });
});
