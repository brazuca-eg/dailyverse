import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("./puzzle", () => ({
  generatePuzzle: () => {
    throw new Error("Could not place the differences");
  },
}));

describe("SpotGame when today's puzzle cannot be made", () => {
  it("says so instead of showing a blank page", async () => {
    const { SpotGame } = await import("./SpotGame");
    render(<SpotGame launchDate={new Date("2026-11-16T00:00:00Z")} />);
    expect(screen.getByText("Today's puzzle could not be loaded.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /picture/ })).not.toBeInTheDocument();
  });
});
