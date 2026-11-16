import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ShareButton } from "./ShareButton";

const SHARE_TEXT = "Dailyverse Mystery Place #2 2/5";

describe("ShareButton", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("offers to share before anything is clicked", () => {
    render(<ShareButton text={SHARE_TEXT} />);
    expect(screen.getByRole("button", { name: "Share result" })).toBeInTheDocument();
  });

  it("copies the text to the clipboard and confirms it", async () => {
    const user = userEvent.setup();
    render(<ShareButton text={SHARE_TEXT} />);
    await user.click(screen.getByRole("button", { name: "Share result" }));
    expect(await screen.findByRole("button", { name: "Copied to clipboard" })).toBeInTheDocument();
    expect(await navigator.clipboard.readText()).toBe(SHARE_TEXT);
  });

  it("tells the player to copy by hand when the clipboard is refused", async () => {
    const user = userEvent.setup();
    vi.spyOn(navigator.clipboard, "writeText").mockRejectedValue(new Error("denied"));
    render(<ShareButton text={SHARE_TEXT} />);
    await user.click(screen.getByRole("button", { name: "Share result" }));
    expect(
      await screen.findByRole("button", { name: "Couldn't copy. Select the text above" }),
    ).toBeInTheDocument();
  });

  it("returns to the original label after two seconds", async () => {
    vi.useFakeTimers();
    userEvent.setup();
    render(<ShareButton text={SHARE_TEXT} />);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Share result" }));
    });
    expect(screen.getByRole("button", { name: "Copied to clipboard" })).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1999);
    });
    expect(screen.getByRole("button", { name: "Copied to clipboard" })).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(screen.getByRole("button", { name: "Share result" })).toBeInTheDocument();
  });
});
