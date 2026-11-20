import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Lives } from "./Lives";
import { SpotGame } from "./SpotGame";

describe("Spot the Difference in German", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-11-16T10:00:00Z"));
    document.documentElement.lang = "de";
    localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
    document.documentElement.lang = "";
  });

  it("translates the rules, controls and pictures without leaking message keys", () => {
    render(<SpotGame launchDate={new Date("2026-11-16T00:00:00Z")} />);
    expect(screen.getByText(/Je weniger Fehler du machst/)).toBeInTheDocument();
    expect(
      screen.getByText("Tippe auf einen Unterschied in einem der beiden Bilder."),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Vergrößern" })).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /^Erstes Bild\./ })).toHaveLength(1);
    expect(screen.getByRole("img", { name: "3 Leben übrig" })).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/spot\.[a-z]+\./);
  });

  it("switches the zoom label when toggled", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<SpotGame launchDate={new Date("2026-11-16T00:00:00Z")} />);
    await user.click(screen.getByRole("button", { name: "Vergrößern" }));
    expect(screen.getByRole("button", { name: "Verkleinern" })).toBeInTheDocument();
  });

  it("uses Ukrainian plural forms for the lives left", () => {
    document.documentElement.lang = "uk";
    const { rerender } = render(<Lives livesLeft={1} />);
    expect(screen.getByRole("img", { name: "Залишилось 1 життя" })).toBeInTheDocument();
    rerender(<Lives livesLeft={0} />);
    expect(screen.getByRole("img", { name: "Залишилось 0 життів" })).toBeInTheDocument();
  });
});
