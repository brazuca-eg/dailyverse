import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Board } from "./Board";
import { easyRound, hardRound, listDirections, mediumRound } from "./fixtures";

type Props = Parameters<typeof Board>[0];

function renderBoard(overrides: Partial<Props> = {}) {
  const props: Props = {
    puzzle: easyRound.puzzle,
    path: [easyRound.puzzle.marks[0]],
    solution: easyRound.solution,
    revealSolution: false,
    isActive: true,
    onMove: vi.fn(),
    onStep: vi.fn(),
    onUndo: vi.fn(),
    onReset: vi.fn(),
    ...overrides,
  };
  const view = render(<Board {...props} />);
  return { props, view };
}

function cell(index: number): HTMLElement {
  return document.querySelector<HTMLElement>(`[data-index="${index}"]`) as HTMLElement;
}

describe("Board", () => {
  afterEach(() => {
    Reflect.deleteProperty(document, "elementFromPoint");
  });

  it("has a button for every square, in a labelled group", () => {
    renderBoard();
    expect(screen.getByRole("group", { name: "Switchback board" })).toBeInTheDocument();
    expect(screen.getAllByRole("button")).toHaveLength(25);
  });

  it("numbers the checkpoints, in order", () => {
    renderBoard();
    const { marks } = easyRound.puzzle;
    marks.forEach((mark, order) => expect(cell(mark)).toHaveTextContent(String(order + 1)));
    expect(document.querySelectorAll(".sw-badge")).toHaveLength(marks.length);
  });

  it("names each square by place, checkpoint and whether it is on the trail", () => {
    const { marks } = easyRound.puzzle;
    const [start] = marks;
    renderBoard();
    expect(cell(start)).toHaveAccessibleName(
      expect.stringContaining("checkpoint 1, end of your trail"),
    );
    expect(cell(marks[1])).toHaveAccessibleName(expect.stringContaining("checkpoint 2, empty"));
    const plain = [...Array(25).keys()].find((index) => !marks.includes(index)) as number;
    expect(cell(plain)).toHaveAccessibleName(expect.stringMatching(/^Row \d, column \d, empty$/));
  });

  it("says where the trail has been and where it ends", () => {
    renderBoard({ path: easyRound.solution.slice(0, 4) });
    expect(cell(easyRound.solution[1])).toHaveAccessibleName(
      expect.stringContaining("on your trail"),
    );
    expect(cell(easyRound.solution[3])).toHaveAccessibleName(
      expect.stringContaining("end of your trail"),
    );
  });

  it("describes fences next to a square", () => {
    const { puzzle } = mediumRound;
    const [first, second] = [...puzzle.walls[0]].sort((a, b) => a - b);
    renderBoard({ puzzle, path: [puzzle.marks[0]], solution: mediumRound.solution });
    const side = second === first + 1 ? "right" : "below";
    expect(cell(first)).toHaveAccessibleName(expect.stringContaining(`fence ${side}`));
    const opposite = second === first + 1 ? "left" : "above";
    expect(cell(second)).toHaveAccessibleName(expect.stringContaining(`fence ${opposite}`));
  });

  it("draws every fence, and none on an easy day", () => {
    renderBoard();
    expect(document.querySelectorAll(".sw-fence")).toHaveLength(0);
    document.body.innerHTML = "";
    const { puzzle } = hardRound;
    renderBoard({ puzzle, path: [puzzle.marks[0]], solution: hardRound.solution });
    expect(document.querySelectorAll(".sw-fence")).toHaveLength(puzzle.walls.length);
  });

  it("draws the trail through the middle of its squares, and a marker at its end", () => {
    const { solution, puzzle } = easyRound;
    renderBoard({ path: solution.slice(0, 3) });
    const points = document.querySelector(".sw-trail")?.getAttribute("points") ?? "";
    const expected = solution
      .slice(0, 3)
      .map(
        (cellIndex) =>
          `${(cellIndex % puzzle.size) + 0.5},${Math.floor(cellIndex / puzzle.size) + 0.5}`,
      )
      .join(" ");
    expect(points).toBe(expected);
    const head = document.querySelector(".sw-head");
    const last = solution[2];
    expect(head).toHaveAttribute("cx", String((last % puzzle.size) + 0.5));
    expect(head).toHaveAttribute("cy", String(Math.floor(last / puzzle.size) + 0.5));
  });

  it("marks checkpoints that are reached and the next one to reach", () => {
    const { solution, puzzle } = easyRound;
    const upToSecond = solution.slice(0, solution.indexOf(puzzle.marks[1]) + 1);
    renderBoard({ path: upToSecond });
    expect(cell(puzzle.marks[0])).toHaveClass("sw-reached");
    expect(cell(puzzle.marks[1])).toHaveClass("sw-reached");
    expect(cell(puzzle.marks[2])).toHaveClass("sw-next");
    expect(cell(puzzle.marks[2])).not.toHaveClass("sw-reached");
  });

  it("tints the squares on the trail", () => {
    const { solution } = easyRound;
    renderBoard({ path: solution.slice(0, 3) });
    expect(cell(solution[1])).toHaveClass("sw-visited");
    expect(cell(solution[10])).not.toHaveClass("sw-visited");
  });

  it("can only be tabbed to at the end of the trail", () => {
    const { solution } = easyRound;
    renderBoard({ path: solution.slice(0, 3) });
    expect(cell(solution[2])).toHaveAttribute("tabindex", "0");
    expect(cell(solution[0])).toHaveAttribute("tabindex", "-1");
  });

  it("moves to a square from the keyboard, with Enter or Space", () => {
    const { props } = renderBoard();
    fireEvent.click(cell(easyRound.solution[1]));
    expect(props.onMove).toHaveBeenCalledWith(easyRound.solution[1]);
  });

  it("does not move twice for a mouse click, which already moved on the press", () => {
    const { props } = renderBoard();
    fireEvent.click(cell(easyRound.solution[1]), { detail: 1 });
    expect(props.onMove).not.toHaveBeenCalled();
  });

  it("starts or continues the trail when a square is pressed", () => {
    const { props } = renderBoard();
    fireEvent.pointerDown(cell(easyRound.solution[1]), { button: 0 });
    expect(props.onMove).toHaveBeenCalledWith(easyRound.solution[1]);
  });

  it("follows a finger dragged across squares, once for each square", () => {
    const { props } = renderBoard();
    const squares = easyRound.solution.slice(1, 4);
    let next = 0;
    document.elementFromPoint = vi.fn(() => cell(squares[next]));
    const board = screen.getByRole("group", { name: "Switchback board" });
    fireEvent.pointerDown(cell(squares[0]), { button: 0 });
    next = 1;
    fireEvent.pointerMove(board, { clientX: 1, clientY: 1 });
    fireEvent.pointerMove(board, { clientX: 2, clientY: 2 });
    next = 2;
    fireEvent.pointerMove(board, { clientX: 3, clientY: 3 });
    expect((props.onMove as ReturnType<typeof vi.fn>).mock.calls).toEqual([
      [squares[0]],
      [squares[1]],
      [squares[2]],
    ]);
  });

  it("stops following when the finger is lifted or leaves the board", () => {
    const { props } = renderBoard();
    document.elementFromPoint = vi.fn(() => cell(easyRound.solution[2]));
    const board = screen.getByRole("group", { name: "Switchback board" });
    fireEvent.pointerDown(cell(easyRound.solution[1]), { button: 0 });
    fireEvent.pointerUp(board);
    fireEvent.pointerMove(board, { clientX: 1, clientY: 1 });
    expect(props.onMove).toHaveBeenCalledTimes(1);
    fireEvent.pointerDown(cell(easyRound.solution[1]), { button: 0 });
    fireEvent.pointerLeave(board);
    fireEvent.pointerMove(board, { clientX: 1, clientY: 1 });
    expect(props.onMove).toHaveBeenCalledTimes(2);
  });

  it("ignores moves that are not part of a drag, and other mouse buttons", () => {
    const { props } = renderBoard();
    document.elementFromPoint = vi.fn(() => cell(easyRound.solution[2]));
    const board = screen.getByRole("group", { name: "Switchback board" });
    fireEvent.pointerMove(board, { clientX: 1, clientY: 1 });
    fireEvent.pointerDown(cell(easyRound.solution[1]), { button: 2 });
    expect(props.onMove).not.toHaveBeenCalled();
  });

  it("steps along the trail with the arrow keys", () => {
    const { props } = renderBoard();
    const target = cell(easyRound.puzzle.marks[0]);
    ["ArrowUp", "ArrowRight", "ArrowDown", "ArrowLeft"].forEach((key) =>
      fireEvent.keyDown(target, { key }),
    );
    expect((props.onStep as ReturnType<typeof vi.fn>).mock.calls).toEqual([
      ["up"],
      ["right"],
      ["down"],
      ["left"],
    ]);
  });

  it("undoes with Backspace or Delete and starts again with R", () => {
    const { props } = renderBoard();
    const target = cell(easyRound.puzzle.marks[0]);
    fireEvent.keyDown(target, { key: "Backspace" });
    fireEvent.keyDown(target, { key: "Delete" });
    expect(props.onUndo).toHaveBeenCalledTimes(2);
    fireEvent.keyDown(target, { key: "r" });
    fireEvent.keyDown(target, { key: "R" });
    expect(props.onReset).toHaveBeenCalledTimes(2);
  });

  it("leaves shortcuts with Ctrl, Cmd or Alt to the browser, and other keys alone", () => {
    const { props } = renderBoard();
    const target = cell(easyRound.puzzle.marks[0]);
    fireEvent.keyDown(target, { key: "ArrowUp", ctrlKey: true });
    fireEvent.keyDown(target, { key: "r", metaKey: true });
    fireEvent.keyDown(target, { key: "Backspace", altKey: true });
    fireEvent.keyDown(target, { key: "x" });
    expect(props.onStep).not.toHaveBeenCalled();
    expect(props.onReset).not.toHaveBeenCalled();
    expect(props.onUndo).not.toHaveBeenCalled();
  });

  it("keeps the focus at the end of the trail after a key press moves it", () => {
    const { solution } = easyRound;
    const { props, view } = renderBoard({ path: solution.slice(0, 2) });
    fireEvent.keyDown(cell(solution[1]), { key: "ArrowRight" });
    view.rerender(<Board {...props} path={solution.slice(0, 3)} />);
    expect(cell(solution[2])).toHaveFocus();
  });

  it("does not steal the focus when the trail changes by touch", () => {
    const { solution } = easyRound;
    const { props, view } = renderBoard({ path: solution.slice(0, 2) });
    view.rerender(<Board {...props} path={solution.slice(0, 3)} />);
    expect(cell(solution[2])).not.toHaveFocus();
  });

  it("shows the route when it is revealed", () => {
    renderBoard({ revealSolution: true });
    expect(document.querySelector(".sw-answer")).toBeInTheDocument();
    document.body.innerHTML = "";
    renderBoard();
    expect(document.querySelector(".sw-answer")).not.toBeInTheDocument();
  });

  it("does nothing after the game: squares are disabled and keys and drags are ignored", () => {
    const { props } = renderBoard({ isActive: false });
    screen.getAllByRole("button").forEach((button) => expect(button).toBeDisabled());
    const board = screen.getByRole("group", { name: "Switchback board" });
    fireEvent.keyDown(board, { key: "ArrowUp" });
    fireEvent.pointerDown(cell(easyRound.solution[1]), { button: 0 });
    expect(props.onStep).not.toHaveBeenCalled();
    expect(props.onMove).not.toHaveBeenCalled();
  });

  it("draws a bigger grid for harder days", () => {
    const { puzzle } = hardRound;
    renderBoard({ puzzle, path: [puzzle.marks[0]], solution: hardRound.solution });
    expect(screen.getAllByRole("button")).toHaveLength(49);
    expect(listDirections(7, hardRound.solution)).toHaveLength(48);
  });
});
