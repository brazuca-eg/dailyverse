import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Lives } from "./Lives";

describe("Lives", () => {
  it("shows a full heart for each life left and an empty one for each lost", () => {
    const { container } = render(<Lives livesLeft={2} />);
    expect(container.textContent).toBe("❤️❤️🤍");
  });

  it("says how many lives are left, once, for screen readers", () => {
    render(<Lives livesLeft={3} />);
    expect(screen.getByRole("img", { name: "3 lives left" })).toBeInTheDocument();
  });

  it("uses the singular for one life", () => {
    render(<Lives livesLeft={1} />);
    expect(screen.getByRole("img", { name: "1 life left" })).toBeInTheDocument();
  });

  it("shows all hearts empty when no lives are left", () => {
    const { container } = render(<Lives livesLeft={0} />);
    expect(container.textContent).toBe("🤍🤍🤍");
    expect(screen.getByRole("img", { name: "0 lives left" })).toBeInTheDocument();
  });
});
