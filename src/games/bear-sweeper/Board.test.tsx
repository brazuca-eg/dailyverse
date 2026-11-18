import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Board } from "./Board";
import { countAdjacentBears, listStartCells } from "./counts";
import { easyRound, hardRound, listSafeCells } from "./fixtures";
import { createInitialState, revealCell, toggleFlag, type BearState } from "./game";

const { puzzle } = easyRound;
const counts = countAdjacentBears(puzzle);
const clearing = new Set(listStartCells(puzzle));
const hiddenSafe = listSafeCells(puzzle).filter((index) => !clearing.has(index));
const [bear] = puzzle.bears;

type Props = Parameters<typeof Board>[0];

function renderBoard(overrides: Partial<Props> = {}, state?: BearState) {
  const props: Props = {
    puzzle,
    state: state ?? createInitialState("easy:0", puzzle),
    counts,
    revealBears: false,
    isActive: true,
    onPress: vi.fn(),
    onFlag: vi.fn(),
    ...overrides,
  };
  const view = render(<Board {...props} />);
  return { props, view };
}

function cell(index: number): HTMLElement {
  return document.querySelector<HTMLElement>(`[data-index="${index}"]`) as HTMLElement;
}

describe("Board", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("is a grid with a button for every square", () => {
    renderBoard();
    expect(screen.getByRole("grid", { name: "Bear Sweeper board" })).toBeInTheDocument();
    expect(screen.getAllByRole("gridcell")).toHaveLength(49);
    expect(screen.getAllByRole("button")).toHaveLength(49);
  });

  it("shows the numbers of the open squares, and nothing on hidden ones", () => {
    renderBoard();
    const numbered = [...clearing].find((index) => counts[index] > 0) as number;
    expect(cell(numbered)).toHaveTextContent(String(counts[numbered]));
    expect(cell(hiddenSafe[0])).toHaveTextContent("");
  });

  it("names each square: hidden, open with its number, open and blank", () => {
    renderBoard();
    const numbered = [...clearing].find((index) => counts[index] > 0) as number;
    const blank = [...clearing].find((index) => counts[index] === 0) as number;
    expect(cell(hiddenSafe[0])).toHaveAccessibleName(
      expect.stringMatching(/^Row \d+, column \d+, hidden$/),
    );
    expect(cell(numbered)).toHaveAccessibleName(
      expect.stringContaining(
        `revealed, ${counts[numbered]} ${counts[numbered] === 1 ? "bear" : "bears"} nearby`,
      ),
    );
    expect(cell(blank)).toHaveAccessibleName(expect.stringContaining("revealed, no bears nearby"));
  });

  it("shows a flag, and names it", () => {
    renderBoard({}, toggleFlag(createInitialState("easy:0", puzzle), hiddenSafe[0]));
    expect(cell(hiddenSafe[0])).toHaveAccessibleName(expect.stringMatching(/, flagged$/));
    expect(cell(hiddenSafe[0]).querySelector("svg")).toBeInTheDocument();
  });

  it("shows a bear that was met, with a paw", () => {
    renderBoard({}, revealCell(createInitialState("easy:0", puzzle), puzzle, bear));
    expect(cell(bear)).toHaveAccessibleName(expect.stringMatching(/, bear$/));
    expect(cell(bear)).toHaveClass("bs-bear");
    expect(cell(bear).querySelector("svg")).toBeInTheDocument();
  });

  it("shows every bear when the game is lost, and crosses out a flag with no bear", () => {
    const flagged = toggleFlag(createInitialState("easy:0", puzzle), hiddenSafe[0]);
    renderBoard({ revealBears: true, isActive: false }, flagged);
    puzzle.bears.forEach((index) => expect(cell(index)).toHaveClass("bs-bear"));
    expect(cell(hiddenSafe[0])).toHaveClass("bs-wrong");
    expect(cell(hiddenSafe[0])).toHaveAccessibleName(
      expect.stringContaining("flagged, no bear here"),
    );
    expect(cell(puzzle.bears[1])).toHaveAccessibleName(expect.stringMatching(/, bear$/));
  });

  it("hides the bears while playing", () => {
    renderBoard();
    puzzle.bears.forEach((index) => expect(cell(index)).not.toHaveClass("bs-bear"));
  });

  it("can be tabbed to at the start square only", () => {
    renderBoard();
    expect(cell(puzzle.start)).toHaveAttribute("tabindex", "0");
    expect(cell(hiddenSafe[0])).toHaveAttribute("tabindex", "-1");
  });

  it("reports a press on a square", () => {
    const { props } = renderBoard();
    fireEvent.click(cell(hiddenSafe[0]));
    expect(props.onPress).toHaveBeenCalledWith(hiddenSafe[0]);
  });

  it("flags with a right click, without opening the menu", () => {
    const { props } = renderBoard();
    const allowed = fireEvent.contextMenu(cell(hiddenSafe[0]));
    expect(allowed).toBe(false);
    expect(props.onFlag).toHaveBeenCalledWith(hiddenSafe[0]);
  });

  it("flags with a long press on touch, and does not also press", () => {
    const { props } = renderBoard();
    fireEvent.pointerDown(cell(hiddenSafe[0]), { pointerType: "touch" });
    vi.advanceTimersByTime(500);
    expect(props.onFlag).toHaveBeenCalledWith(hiddenSafe[0]);
    fireEvent.pointerUp(cell(hiddenSafe[0]));
    fireEvent.click(cell(hiddenSafe[0]));
    expect(props.onPress).not.toHaveBeenCalled();
  });

  it("presses normally after a short touch", () => {
    const { props } = renderBoard();
    fireEvent.pointerDown(cell(hiddenSafe[0]), { pointerType: "touch" });
    vi.advanceTimersByTime(100);
    fireEvent.pointerUp(cell(hiddenSafe[0]));
    fireEvent.click(cell(hiddenSafe[0]));
    expect(props.onFlag).not.toHaveBeenCalled();
    expect(props.onPress).toHaveBeenCalledWith(hiddenSafe[0]);
  });

  it("does not flag with a long press of the mouse", () => {
    const { props } = renderBoard();
    fireEvent.pointerDown(cell(hiddenSafe[0]), { pointerType: "mouse" });
    vi.advanceTimersByTime(800);
    expect(props.onFlag).not.toHaveBeenCalled();
  });

  it("does not flag when the finger leaves before the long press is done", () => {
    const { props } = renderBoard();
    fireEvent.pointerDown(cell(hiddenSafe[0]), { pointerType: "touch" });
    vi.advanceTimersByTime(200);
    fireEvent.pointerLeave(screen.getByRole("grid"));
    vi.advanceTimersByTime(800);
    expect(props.onFlag).not.toHaveBeenCalled();
  });

  it("flags with the F key and moves with the arrow keys", () => {
    const { props } = renderBoard();
    fireEvent.keyDown(cell(hiddenSafe[0]), { key: "f" });
    fireEvent.keyDown(cell(hiddenSafe[0]), { key: "F" });
    expect(props.onFlag).toHaveBeenCalledTimes(2);
    cell(0).focus();
    fireEvent.keyDown(cell(0), { key: "ArrowRight" });
    expect(cell(1)).toHaveFocus();
    fireEvent.keyDown(cell(1), { key: "ArrowDown" });
    expect(cell(1 + puzzle.size)).toHaveFocus();
    fireEvent.keyDown(cell(0), { key: "ArrowUp" });
    expect(cell(0)).toHaveFocus();
  });

  it("leaves shortcuts with Ctrl, Cmd or Alt to the browser", () => {
    const { props } = renderBoard();
    fireEvent.keyDown(cell(hiddenSafe[0]), { key: "f", ctrlKey: true });
    fireEvent.keyDown(cell(hiddenSafe[0]), { key: "f", metaKey: true });
    expect(props.onFlag).not.toHaveBeenCalled();
  });

  it("does nothing after the game", () => {
    const { props } = renderBoard({ isActive: false });
    fireEvent.click(cell(hiddenSafe[0]));
    fireEvent.contextMenu(cell(hiddenSafe[0]));
    fireEvent.keyDown(cell(hiddenSafe[0]), { key: "f" });
    fireEvent.pointerDown(cell(hiddenSafe[0]), { pointerType: "touch" });
    vi.advanceTimersByTime(800);
    expect(props.onPress).not.toHaveBeenCalled();
    expect(props.onFlag).not.toHaveBeenCalled();
  });

  it("draws a bigger grid for harder days", () => {
    const hardState = createInitialState("hard:0", hardRound.puzzle);
    render(
      <Board
        puzzle={hardRound.puzzle}
        state={hardState}
        counts={countAdjacentBears(hardRound.puzzle)}
        revealBears={false}
        isActive
        onPress={vi.fn()}
        onFlag={vi.fn()}
      />,
    );
    expect(screen.getAllByRole("gridcell")).toHaveLength(121);
  });
});
