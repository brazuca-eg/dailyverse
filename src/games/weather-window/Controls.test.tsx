import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Controls } from "./Controls";

function renderControls(overrides: Partial<Parameters<typeof Controls>[0]> = {}) {
  const onTogglePeek = vi.fn();
  const onSubmit = vi.fn();
  render(
    <Controls
      isPeekArmed={false}
      peeksLeft={2}
      canSubmit
      onTogglePeek={onTogglePeek}
      onSubmit={onSubmit}
      {...overrides}
    />,
  );
  return { onTogglePeek, onSubmit };
}

describe("Controls", () => {
  it("shows how many peeks are left", () => {
    renderControls({ peeksLeft: 1 });
    expect(screen.getByRole("button", { name: "Peek (1 left)" })).toBeEnabled();
  });

  it("asks for a day while a peek is armed, and stays usable to cancel it", () => {
    renderControls({ isPeekArmed: true, peeksLeft: 0 });
    const button = screen.getByRole("button", { name: "Pick a day" });
    expect(button).toBeEnabled();
    expect(button).toHaveAttribute("aria-pressed", "true");
  });

  it("disables peeking when none are left", () => {
    renderControls({ peeksLeft: 0 });
    expect(screen.getByRole("button", { name: "Peek (0 left)" })).toBeDisabled();
  });

  it("allows submitting only when the plan is complete", () => {
    renderControls({ canSubmit: false });
    expect(screen.getByRole("button", { name: "Submit plan" })).toBeDisabled();
  });

  it("reports taps", () => {
    const { onTogglePeek, onSubmit } = renderControls();
    fireEvent.click(screen.getByRole("button", { name: "Peek (2 left)" }));
    fireEvent.click(screen.getByRole("button", { name: "Submit plan" }));
    expect(onTogglePeek).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });
});
