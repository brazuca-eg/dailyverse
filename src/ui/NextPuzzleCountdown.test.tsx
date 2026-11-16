import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextPuzzleCountdown } from "./NextPuzzleCountdown";

describe("NextPuzzleCountdown", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows the time left until the next UTC midnight", () => {
    vi.setSystemTime(new Date("2026-11-16T18:00:00Z"));
    render(<NextPuzzleCountdown />);
    expect(screen.getByText("Next puzzle in")).toBeInTheDocument();
    expect(screen.getByRole("timer")).toHaveTextContent("06:00:00");
  });

  it("counts down every second", () => {
    vi.setSystemTime(new Date("2026-11-16T18:00:00Z"));
    render(<NextPuzzleCountdown />);
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.getByRole("timer")).toHaveTextContent("05:59:59");
    act(() => {
      vi.advanceTimersByTime(59_000);
    });
    expect(screen.getByRole("timer")).toHaveTextContent("05:59:00");
  });

  it("offers to play the new puzzle once the countdown reaches zero", () => {
    vi.setSystemTime(new Date("2026-11-16T23:59:58Z"));
    render(<NextPuzzleCountdown />);
    expect(screen.getByRole("timer")).toHaveTextContent("00:00:02");

    act(() => {
      vi.advanceTimersByTime(2500);
    });
    expect(screen.queryByRole("timer")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Play today's puzzle" })).toBeInTheDocument();
  });

  it("stops ticking when it is removed", () => {
    vi.setSystemTime(new Date("2026-11-16T18:00:00Z"));
    const { unmount } = render(<NextPuzzleCountdown />);
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});
