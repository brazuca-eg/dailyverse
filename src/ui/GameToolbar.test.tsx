import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { GameToolbar } from "./GameToolbar";

describe("GameToolbar", () => {
  it("opens the help from its own button", async () => {
    const onShowHelp = vi.fn();
    const onShowStats = vi.fn();
    render(<GameToolbar onShowHelp={onShowHelp} onShowStats={onShowStats} />);
    await userEvent.setup().click(screen.getByRole("button", { name: "How to play" }));
    expect(onShowHelp).toHaveBeenCalledTimes(1);
    expect(onShowStats).not.toHaveBeenCalled();
  });

  it("opens the stats from its own button", async () => {
    const onShowHelp = vi.fn();
    const onShowStats = vi.fn();
    render(<GameToolbar onShowHelp={onShowHelp} onShowStats={onShowStats} />);
    await userEvent.setup().click(screen.getByRole("button", { name: "Your stats" }));
    expect(onShowStats).toHaveBeenCalledTimes(1);
    expect(onShowHelp).not.toHaveBeenCalled();
  });
});
