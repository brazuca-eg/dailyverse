import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { EndGameButton, TrailControls } from "./TrailControls";

function renderControls(overrides = {}) {
  const props = {
    canDelete: true,
    canSubmit: true,
    onDelete: vi.fn(),
    onShuffle: vi.fn(),
    onSubmit: vi.fn(),
    ...overrides,
  };
  render(<TrailControls {...props} />);
  return props;
}

describe("TrailControls", () => {
  it("calls the right action for each button", () => {
    const props = renderControls();
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    fireEvent.click(screen.getByRole("button", { name: "Shuffle" }));
    fireEvent.click(screen.getByRole("button", { name: "Enter" }));
    expect(props.onDelete).toHaveBeenCalledTimes(1);
    expect(props.onShuffle).toHaveBeenCalledTimes(1);
    expect(props.onSubmit).toHaveBeenCalledTimes(1);
  });

  it("disables Delete and Enter when there is nothing typed", () => {
    renderControls({ canDelete: false, canSubmit: false });
    expect(screen.getByRole("button", { name: "Delete" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Enter" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Shuffle" })).toBeEnabled();
  });
});

describe("EndGameButton", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("asks for a second tap before ending the game", () => {
    const onEnd = vi.fn();
    render(<EndGameButton onEnd={onEnd} />);
    fireEvent.click(screen.getByRole("button", { name: "End game" }));
    expect(onEnd).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Tap again to end the game" }));
    expect(onEnd).toHaveBeenCalledTimes(1);
  });

  it("goes back to normal if the second tap does not come", () => {
    render(<EndGameButton onEnd={() => undefined} />);
    fireEvent.click(screen.getByRole("button", { name: "End game" }));
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(
      screen.queryByRole("button", { name: "Tap again to end the game" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "End game" })).toBeInTheDocument();
  });
});
