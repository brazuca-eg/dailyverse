import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { easyRound, findEmptyCells, hardRound } from "./fixtures";
import { Board } from "./Board";
import {
  createInitialState,
  enterDigit,
  readValues,
  toggleNote,
  checkBoard,
  type SudokuState,
} from "./game";

const { puzzle } = easyRound;
const empties = findEmptyCells(easyRound);
const [first, second] = empties;

type Props = Parameters<typeof Board>[0];

function renderBoard(overrides: Partial<Props> = {}, state?: SudokuState) {
  const current = state ?? createInitialState("easy:0", puzzle.size);
  const props: Props = {
    puzzle,
    state: current,
    values: readValues(puzzle, current.entries),
    conflicts: new Set(),
    selected: first,
    revealSolution: false,
    onSelect: vi.fn(),
    onDigit: vi.fn(),
    onErase: vi.fn(),
    onUndo: vi.fn(),
    onToggleNotes: vi.fn(),
    ...overrides,
  };
  render(<Board {...props} />);
  return props;
}

function cell(index: number): HTMLElement {
  const row = Math.floor(index / puzzle.size) + 1;
  const col = (index % puzzle.size) + 1;
  return screen.getByRole("button", { name: new RegExp(`^Row ${row}, column ${col},`) });
}

describe("Board", () => {
  it("is a grid with a button for every square", () => {
    renderBoard();
    expect(screen.getByRole("grid", { name: "Trail Sudoku board" })).toBeInTheDocument();
    expect(screen.getAllByRole("gridcell")).toHaveLength(36);
    expect(screen.getAllByRole("button")).toHaveLength(36);
  });

  it("names every square by place and content: given, empty, entered", () => {
    const state = enterDigit(createInitialState("easy:0", 6), puzzle, first, 3);
    renderBoard({}, state);
    const given = puzzle.givens.findIndex((digit) => digit !== 0);
    expect(cell(given)).toHaveAccessibleName(
      `Row ${Math.floor(given / 6) + 1}, column ${(given % 6) + 1}, given ${puzzle.givens[given]}`,
    );
    expect(cell(first)).toHaveAccessibleName(expect.stringContaining("entered 3"));
    expect(cell(second)).toHaveAccessibleName(expect.stringContaining(", empty"));
  });

  it("lists the notes of an empty square", () => {
    const state = toggleNote(
      toggleNote(createInitialState("easy:0", 6), puzzle, first, 2),
      puzzle,
      first,
      5,
    );
    renderBoard({}, state);
    expect(cell(first)).toHaveAccessibleName(expect.stringContaining("empty, notes 2 5"));
    expect(cell(first).querySelector(".sudoku-notes")).toHaveTextContent("25");
  });

  it("says when a square clashes or was found wrong", () => {
    const entered = enterDigit(
      createInitialState("easy:0", 6),
      puzzle,
      first,
      (puzzle.solution[first] % 6) + 1,
    );
    const state = checkBoard(entered, puzzle).state;
    renderBoard({ conflicts: new Set([first]) }, state);
    expect(cell(first)).toHaveAccessibleName(expect.stringContaining("clashes, wrong"));
    expect(cell(first)).toHaveClass("sudoku-conflict");
    expect(cell(first)).toHaveClass("sudoku-flagged");
    expect(cell(first)).toHaveTextContent("✗");
    expect(cell(second)).not.toHaveClass("sudoku-flagged");
  });

  it("highlights the selected square, its row, column and box, and the same digit", () => {
    const given = puzzle.givens.findIndex((digit) => digit !== 0);
    const sameDigit = puzzle.givens.findIndex(
      (digit, index) => digit === puzzle.givens[given] && index !== given,
    );
    renderBoard({ selected: given });
    expect(cell(given)).toHaveClass("sudoku-selected");
    expect(document.querySelectorAll(".sudoku-peer").length).toBeGreaterThan(8);
    if (sameDigit >= 0) {
      expect(cell(sameDigit)).toHaveClass("sudoku-same");
    }
  });

  it("makes only one square reachable by Tab, and it is the selected one", () => {
    renderBoard({ selected: second });
    expect(cell(second)).toHaveAttribute("tabindex", "0");
    expect(cell(first)).toHaveAttribute("tabindex", "-1");
    expect(cell(second)).toHaveAttribute("aria-current", "true");
  });

  it("selects a square when it is tapped", () => {
    const props = renderBoard();
    fireEvent.click(cell(second));
    expect(props.onSelect).toHaveBeenCalledWith(second);
  });

  it("moves the selection with the arrow keys, and stops at the edges", () => {
    const props = renderBoard({ selected: 0 });
    fireEvent.keyDown(cell(0), { key: "ArrowRight" });
    expect(props.onSelect).toHaveBeenLastCalledWith(1);
    fireEvent.keyDown(cell(0), { key: "ArrowDown" });
    expect(props.onSelect).toHaveBeenLastCalledWith(6);
    fireEvent.keyDown(cell(0), { key: "ArrowLeft" });
    expect(props.onSelect).toHaveBeenLastCalledWith(0);
    fireEvent.keyDown(cell(0), { key: "ArrowUp" });
    expect(props.onSelect).toHaveBeenLastCalledWith(0);
  });

  it("passes on digits, but only those that exist in this grid", () => {
    const props = renderBoard();
    fireEvent.keyDown(cell(first), { key: "4" });
    fireEvent.keyDown(cell(first), { key: "6" });
    fireEvent.keyDown(cell(first), { key: "7" });
    fireEvent.keyDown(cell(first), { key: "a" });
    expect((props.onDigit as ReturnType<typeof vi.fn>).mock.calls).toEqual([[4], [6]]);
  });

  it("erases with Backspace, Delete and 0, toggles notes with N and undoes with U", () => {
    const props = renderBoard();
    ["Backspace", "Delete", "0"].forEach((key) => fireEvent.keyDown(cell(first), { key }));
    expect(props.onErase).toHaveBeenCalledTimes(3);
    fireEvent.keyDown(cell(first), { key: "n" });
    fireEvent.keyDown(cell(first), { key: "N" });
    expect(props.onToggleNotes).toHaveBeenCalledTimes(2);
    fireEvent.keyDown(cell(first), { key: "u" });
    expect(props.onUndo).toHaveBeenCalledTimes(1);
  });

  it("leaves shortcuts with Ctrl, Cmd or Alt to the browser", () => {
    const props = renderBoard();
    fireEvent.keyDown(cell(first), { key: "4", ctrlKey: true });
    fireEvent.keyDown(cell(first), { key: "u", metaKey: true });
    fireEvent.keyDown(cell(first), { key: "n", altKey: true });
    expect(props.onDigit).not.toHaveBeenCalled();
    expect(props.onUndo).not.toHaveBeenCalled();
    expect(props.onToggleNotes).not.toHaveBeenCalled();
  });

  it("shows the solution in the empty and wrong squares when it is revealed", () => {
    const wrong = enterDigit(
      createInitialState("easy:0", 6),
      puzzle,
      first,
      (puzzle.solution[first] % 6) + 1,
    );
    renderBoard({ revealSolution: true }, wrong);
    expect(cell(first)).toHaveClass("sudoku-answer");
    expect(cell(first)).toHaveTextContent(String(puzzle.solution[first]));
    expect(cell(second)).toHaveTextContent(String(puzzle.solution[second]));
    const given = puzzle.givens.findIndex((digit) => digit !== 0);
    expect(cell(given)).not.toHaveClass("sudoku-answer");
  });

  it("marks the box borders: 2 rows by 3 columns in 6x6", () => {
    renderBoard();
    expect(cell(3)).toHaveClass("sudoku-box-left");
    expect(cell(2 * 6)).toHaveClass("sudoku-box-top");
    expect(cell(1)).not.toHaveClass("sudoku-box-left");
    expect(cell(6)).not.toHaveClass("sudoku-box-top");
  });

  it("draws a 9x9 grid with 3x3 boxes", () => {
    const state = createInitialState("hard:0", 9);
    const props: Props = {
      puzzle: hardRound.puzzle,
      state,
      values: readValues(hardRound.puzzle, state.entries),
      conflicts: new Set(),
      selected: null,
      revealSolution: false,
      onSelect: vi.fn(),
      onDigit: vi.fn(),
      onErase: vi.fn(),
      onUndo: vi.fn(),
      onToggleNotes: vi.fn(),
    };
    render(<Board {...props} />);
    expect(screen.getAllByRole("gridcell")).toHaveLength(81);
    const cells = screen.getAllByRole("button");
    expect(cells[3]).toHaveClass("sudoku-box-left");
    expect(cells[27]).toHaveClass("sudoku-box-top");
    expect(cells[1]).not.toHaveClass("sudoku-box-left");
  });
});
