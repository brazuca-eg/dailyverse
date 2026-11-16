import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("./generator", () => ({
  generateTentsPuzzle: () => {
    throw new Error("Could not make a tents puzzle");
  },
}));

describe("TentsGame when today's puzzle cannot be made", () => {
  it("says so instead of showing a blank page", async () => {
    const { TentsGame } = await import("./TentsGame");
    render(<TentsGame launchDate={new Date("2026-11-16T00:00:00Z")} />);
    expect(screen.getByText("Today's puzzle could not be loaded.")).toBeInTheDocument();
    expect(screen.queryByRole("grid")).not.toBeInTheDocument();
  });
});
