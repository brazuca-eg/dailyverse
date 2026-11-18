import { createEvent, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { formatValue } from "./format";
import { SOLVED, listNames, puzzle } from "./fixtures";
import { PeakList } from "./PeakList";

type Props = Parameters<typeof PeakList>[0];

function renderList(overrides: Partial<Props> = {}) {
  const props: Props = {
    puzzle,
    order: [...puzzle.start],
    confirmed: [false, false, false, false, false],
    selected: null,
    isActive: true,
    isRevealed: false,
    focusRequest: null,
    onPressRow: vi.fn(),
    onShift: vi.fn(),
    onDrop: vi.fn(),
    onDeselect: vi.fn(),
    ...overrides,
  };
  const view = render(<PeakList {...props} />);
  return { props, view };
}

function rowButton(position: number): HTMLElement {
  return screen.getByRole("button", { name: new RegExp(`position ${position + 1} of 5`) });
}

describe("PeakList", () => {
  it("lists the five items in order, each with its position", () => {
    renderList();
    listNames(puzzle.start).forEach((name, position) => {
      expect(rowButton(position)).toHaveAccessibleName(`${name}, position ${position + 1} of 5`);
    });
    expect(screen.getByRole("list", { name: /Your order/ })).toBeInTheDocument();
  });

  it("names both ends of the order", () => {
    renderList();
    expect(screen.getByRole("list", { name: /first/ })).toBeInTheDocument();
    expect(screen.getAllByText(/^[a-z]+$/i, { selector: ".peak-end" })).toHaveLength(2);
  });

  it("tells which row is selected", () => {
    renderList({ selected: 2 });
    expect(rowButton(2)).toHaveAttribute("aria-pressed", "true");
    expect(rowButton(1)).toHaveAttribute("aria-pressed", "false");
  });

  it("marks the items that are in the right place, in words and not only colour", () => {
    renderList({ confirmed: [false, true, false, false, true] });
    expect(screen.getAllByText("In place")).toHaveLength(2);
    expect(rowButton(1)).toHaveAccessibleName(/in the right place/);
    expect(rowButton(0)).not.toHaveAccessibleName(/in the right place/);
  });

  it("reports a tap on a row", () => {
    const { props } = renderList();
    fireEvent.click(rowButton(3));
    expect(props.onPressRow).toHaveBeenCalledWith(3);
  });

  it("has move buttons that report the direction and what to focus, and cannot move past the ends", () => {
    const { props } = renderList();
    const [first, , , , last] = listNames(puzzle.start);
    expect(screen.getByRole("button", { name: `Move ${first} up` })).toBeDisabled();
    expect(screen.getByRole("button", { name: `Move ${last} down` })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: `Move ${listNames(puzzle.start)[2]} up` }));
    expect(props.onShift).toHaveBeenCalledWith(2, -1, "up");
    fireEvent.click(
      screen.getByRole("button", { name: `Move ${listNames(puzzle.start)[2]} down` }),
    );
    expect(props.onShift).toHaveBeenCalledWith(2, 1, "down");
  });

  it("moves the selected row with the arrow keys, and only when it is selected", () => {
    const { props, view } = renderList({ selected: 1 });
    fireEvent.keyDown(rowButton(1), { key: "ArrowUp" });
    fireEvent.keyDown(rowButton(1), { key: "ArrowDown" });
    expect((props.onShift as ReturnType<typeof vi.fn>).mock.calls).toEqual([
      [1, -1, "row"],
      [1, 1, "row"],
    ]);
    fireEvent.keyDown(rowButton(0), { key: "ArrowDown" });
    expect(props.onShift).toHaveBeenCalledTimes(2);
    view.unmount();
  });

  it("clears the selection with Escape", () => {
    const { props } = renderList({ selected: 1 });
    fireEvent.keyDown(rowButton(1), { key: "Escape" });
    expect(props.onDeselect).toHaveBeenCalledTimes(1);
  });

  it("lets a row be dragged to another place", () => {
    const { props } = renderList();
    const rows = screen.getAllByRole("listitem");
    expect(rows[0]).toHaveAttribute("draggable", "true");
    const data = new Map<string, string>();
    const dataTransfer = {
      setData: (type: string, value: string) => data.set(type, value),
      getData: (type: string) => data.get(type) ?? "",
      effectAllowed: "",
    };
    fireEvent.dragStart(rows[1], { dataTransfer });
    const over = createEvent.dragOver(rows[3], { dataTransfer });
    fireEvent(rows[3], over);
    expect(over.defaultPrevented).toBe(true);
    fireEvent.drop(rows[3], { dataTransfer });
    expect(props.onDrop).toHaveBeenCalledWith(1, 3);
  });

  it("ignores a drop that did not start from a row", () => {
    const { props } = renderList();
    const rows = screen.getAllByRole("listitem");
    fireEvent.drop(rows[2], { dataTransfer: { getData: () => "1", setData: () => undefined } });
    fireEvent.drop(rows[2], { dataTransfer: { getData: () => "", setData: () => undefined } });
    expect(props.onDrop).not.toHaveBeenCalled();
  });

  it("counts a drag only once", () => {
    const { props } = renderList();
    const rows = screen.getAllByRole("listitem");
    const dataTransfer = { setData: () => undefined, getData: () => "", effectAllowed: "" };
    fireEvent.dragStart(rows[0], { dataTransfer });
    fireEvent.drop(rows[2], { dataTransfer });
    fireEvent.drop(rows[3], { dataTransfer });
    expect(props.onDrop).toHaveBeenCalledTimes(1);
    expect(props.onDrop).toHaveBeenCalledWith(0, 2);
  });

  it("puts focus on the item and control that were asked for", () => {
    const item = puzzle.start[2];
    renderList({ focusRequest: { item, target: "down", id: 1 } });
    expect(
      screen.getByRole("button", { name: `Move ${puzzle.items[item].name} down` }),
    ).toHaveFocus();
  });

  it("falls back to the row when the control that was asked for cannot be used", () => {
    const item = puzzle.start[0];
    renderList({ focusRequest: { item, target: "up", id: 1 } });
    expect(rowButton(0)).toHaveFocus();
  });

  it("is plain text after the game, with the real values and no controls", () => {
    renderList({ order: SOLVED, isActive: false, isRevealed: true });
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    puzzle.items.forEach((item, position) => {
      expect(
        screen.getByRole("group", {
          name: `${item.name}, position ${position + 1} of 5, ${formatValue(item.value, puzzle.category)}`,
        }),
      ).toBeInTheDocument();
    });
    screen
      .getAllByRole("listitem")
      .forEach((row) => expect(row).toHaveAttribute("draggable", "false"));
  });

  it("does not show the values while playing", () => {
    renderList();
    puzzle.items.forEach((item) =>
      expect(screen.queryByText(formatValue(item.value, puzzle.category))).not.toBeInTheDocument(),
    );
  });
});
