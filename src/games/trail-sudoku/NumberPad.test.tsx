import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NumberPad } from "./NumberPad";

type Props = Parameters<typeof NumberPad>[0];

function renderPad(overrides: Partial<Props> = {}) {
  const props: Props = {
    size: 6,
    counts: [1, 2, 3, 4, 5, 6],
    isNotesMode: false,
    canUndo: true,
    onDigit: vi.fn(),
    onErase: vi.fn(),
    onUndo: vi.fn(),
    onToggleNotes: vi.fn(),
    onCheck: vi.fn(),
    onHint: vi.fn(),
    onGiveUp: vi.fn(),
    ...overrides,
  };
  render(<NumberPad {...props} />);
  return props;
}

describe("NumberPad", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("has a key for every digit, with how many are left to place", () => {
    renderPad();
    expect(screen.getAllByRole("button", { name: /, \d left$/ })).toHaveLength(6);
    expect(screen.getByRole("button", { name: "1, 5 left" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "5, 1 left" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "6, 0 left" })).toBeDisabled();
  });

  it("has nine keys on a 9x9 board", () => {
    renderPad({ size: 9, counts: [0, 0, 0, 0, 0, 0, 0, 0, 0] });
    expect(screen.getByRole("group", { name: "Numbers" }).children).toHaveLength(9);
  });

  it("reports the digit that is pressed", () => {
    const props = renderPad();
    fireEvent.click(screen.getByRole("button", { name: "3, 3 left" }));
    expect(props.onDigit).toHaveBeenCalledWith(3);
  });

  it("does not offer a digit that is already used up", () => {
    const props = renderPad();
    fireEvent.click(screen.getByRole("button", { name: "6, 0 left" }));
    expect(props.onDigit).not.toHaveBeenCalled();
  });

  it("never shows a negative count when too many are placed", () => {
    renderPad({ counts: [9, 0, 0, 0, 0, 0] });
    expect(screen.getByRole("button", { name: "1, 0 left" })).toBeDisabled();
  });

  it("runs each action from its own button", () => {
    const props = renderPad();
    fireEvent.click(screen.getByRole("button", { name: "Erase" }));
    fireEvent.click(screen.getByRole("button", { name: "Undo" }));
    fireEvent.click(screen.getByRole("button", { name: "Check" }));
    fireEvent.click(screen.getByRole("button", { name: "Hint" }));
    fireEvent.click(screen.getByRole("button", { name: /Notes/ }));
    expect(props.onErase).toHaveBeenCalledTimes(1);
    expect(props.onUndo).toHaveBeenCalledTimes(1);
    expect(props.onCheck).toHaveBeenCalledTimes(1);
    expect(props.onHint).toHaveBeenCalledTimes(1);
    expect(props.onToggleNotes).toHaveBeenCalledTimes(1);
  });

  it("shows whether notes are on, and says so to screen readers", () => {
    renderPad({ isNotesMode: true });
    expect(screen.getByRole("button", { name: "Notes on" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("shows notes off by default", () => {
    renderPad();
    expect(screen.getByRole("button", { name: "Notes off" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("disables Undo when there is nothing to undo", () => {
    renderPad({ canUndo: false });
    expect(screen.getByRole("button", { name: "Undo" })).toBeDisabled();
  });

  it("asks for a second tap before giving up", () => {
    const props = renderPad();
    fireEvent.click(screen.getByRole("button", { name: "Give up" }));
    expect(props.onGiveUp).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Tap again" }));
    expect(props.onGiveUp).toHaveBeenCalledTimes(1);
  });
});
