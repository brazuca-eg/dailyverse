import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { RulesPanel } from "./RulesPanel";

describe("RulesPanel", () => {
  it("lists the steps in order", () => {
    render(<RulesPanel steps={["First", "Second", "Third"]} onStart={vi.fn()} />);
    expect(screen.getAllByRole("listitem").map((item) => item.textContent)).toEqual([
      "First",
      "Second",
      "Third",
    ]);
  });

  it("shows the example only when there is one, hidden from screen readers", () => {
    const { container, rerender } = render(<RulesPanel steps={["One"]} onStart={vi.fn()} />);
    expect(container.querySelector(".example")).toBeNull();
    rerender(<RulesPanel steps={["One"]} example={<span>Sample</span>} onStart={vi.fn()} />);
    expect(container.querySelector(".example")).toHaveAttribute("aria-hidden", "true");
    expect(screen.getByText("Sample")).toBeInTheDocument();
  });

  it("starts the game from its button", async () => {
    const onStart = vi.fn();
    render(<RulesPanel steps={["One"]} onStart={onStart} />);
    await userEvent.setup().click(screen.getByRole("button", { name: "Start playing" }));
    expect(onStart).toHaveBeenCalledTimes(1);
  });

  it("tells players when the next puzzle arrives", () => {
    render(<RulesPanel steps={["One"]} onStart={vi.fn()} />);
    expect(screen.getByText(/00:00 UTC/)).toBeInTheDocument();
  });
});
