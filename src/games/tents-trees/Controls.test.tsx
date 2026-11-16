import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Controls } from "./Controls";

function renderControls(canUndo = true) {
  const handlers = {
    onUndo: vi.fn(),
    onClear: vi.fn(),
    onCheck: vi.fn(),
    onHint: vi.fn(),
    onGiveUp: vi.fn(),
  };
  render(<Controls canUndo={canUndo} {...handlers} />);
  return handlers;
}

describe("Controls", () => {
  it("offers undo, check, hint, clear and give up", () => {
    renderControls();
    ["Undo", "Check", "Hint", "Clear", "Give up"].forEach((name) => {
      expect(screen.getByRole("button", { name })).toBeInTheDocument();
    });
  });

  it("runs undo, check and hint on one tap", () => {
    const handlers = renderControls();
    fireEvent.click(screen.getByRole("button", { name: "Undo" }));
    fireEvent.click(screen.getByRole("button", { name: "Check" }));
    fireEvent.click(screen.getByRole("button", { name: "Hint" }));
    expect(handlers.onUndo).toHaveBeenCalledTimes(1);
    expect(handlers.onCheck).toHaveBeenCalledTimes(1);
    expect(handlers.onHint).toHaveBeenCalledTimes(1);
  });

  it("disables undo when there is nothing to undo", () => {
    renderControls(false);
    expect(screen.getByRole("button", { name: "Undo" })).toBeDisabled();
  });

  it("asks for a second tap before clearing", () => {
    const { onClear } = renderControls();
    fireEvent.click(screen.getByRole("button", { name: "Clear" }));
    expect(onClear).not.toHaveBeenCalled();
    fireEvent.click(screen.getAllByRole("button", { name: "Tap again" })[0]);
    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it("asks for a second tap before giving up, and says it is waiting", () => {
    const { onGiveUp } = renderControls();
    const giveUp = screen.getByRole("button", { name: "Give up" });
    fireEvent.click(giveUp);
    expect(onGiveUp).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Tap again", pressed: true })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Tap again" }));
    expect(onGiveUp).toHaveBeenCalledTimes(1);
  });

  it("arms clear and give up separately", () => {
    const { onClear, onGiveUp } = renderControls();
    fireEvent.click(screen.getByRole("button", { name: "Clear" }));
    fireEvent.click(screen.getByRole("button", { name: "Give up" }));
    expect(onClear).not.toHaveBeenCalled();
    expect(onGiveUp).not.toHaveBeenCalled();
  });
});
