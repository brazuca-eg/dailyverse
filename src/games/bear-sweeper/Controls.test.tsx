import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Controls } from "./Controls";

function renderControls(isFlagMode = false) {
  const props = { isFlagMode, onToggleFlagMode: vi.fn(), onHint: vi.fn(), onGiveUp: vi.fn() };
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

  it("switches flag mode and asks for a hint with a single tap", () => {
    const props = renderControls();
    fireEvent.click(screen.getByRole("button", { name: /Flag mode/ }));
    fireEvent.click(screen.getByRole("button", { name: "Hint" }));
    expect(props.onToggleFlagMode).toHaveBeenCalledTimes(1);
    expect(props.onHint).toHaveBeenCalledTimes(1);
  });

  it("shows whether flag mode is on, and says so to screen readers", () => {
    renderControls(true);
    expect(screen.getByRole("button", { name: "Flag mode on" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("shows flag mode off by default", () => {
    renderControls();
    expect(screen.getByRole("button", { name: "Flag mode off" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("asks for a second tap before giving up", () => {
    const props = renderControls();
    fireEvent.click(screen.getByRole("button", { name: "Give up" }));
    expect(props.onGiveUp).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Tap again" }));
    expect(props.onGiveUp).toHaveBeenCalledTimes(1);
  });
});
