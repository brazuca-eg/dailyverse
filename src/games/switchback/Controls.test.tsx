import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Controls } from "./Controls";

function renderControls(canUndo = true) {
  const props = { canUndo, onUndo: vi.fn(), onReset: vi.fn(), onHint: vi.fn(), onGiveUp: vi.fn() };
  render(<Controls {...props} />);
  return props;
}

describe("Controls", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("undoes and hints with a single tap", () => {
    const props = renderControls();
    fireEvent.click(screen.getByRole("button", { name: "Undo" }));
    fireEvent.click(screen.getByRole("button", { name: "Hint" }));
    expect(props.onUndo).toHaveBeenCalledTimes(1);
    expect(props.onHint).toHaveBeenCalledTimes(1);
  });

  it("disables Undo and Reset when the trail has not started", () => {
    renderControls(false);
    expect(screen.getByRole("button", { name: "Undo" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Reset" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Hint" })).toBeEnabled();
  });

  it("asks for a second tap before resetting", () => {
    const props = renderControls();
    fireEvent.click(screen.getByRole("button", { name: "Reset" }));
    expect(props.onReset).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Tap again" }));
    expect(props.onReset).toHaveBeenCalledTimes(1);
  });

  it("asks for a second tap before giving up", () => {
    const props = renderControls();
    fireEvent.click(screen.getByRole("button", { name: "Give up" }));
    expect(props.onGiveUp).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Tap again" }));
    expect(props.onGiveUp).toHaveBeenCalledTimes(1);
  });
});
