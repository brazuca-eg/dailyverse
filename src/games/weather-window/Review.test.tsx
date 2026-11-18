import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CONFLICT } from "./fixtures";
import { Review } from "./Review";

describe("Review", () => {
  it("shows each trip with the plan and the best choice", () => {
    render(<Review puzzle={CONFLICT} plan={[0, 1]} />);
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    expect(screen.getByText("You: Monday, Sunny, 3 points")).toBeVisible();
    expect(screen.getByText("You: Tuesday, Cloudy, 1 point")).toBeVisible();
  });

  it("shows where the best plan would have put a trip that was placed worse", () => {
    render(<Review puzzle={CONFLICT} plan={[0, 1]} />);
    expect(screen.getByText("Best: Tuesday, Cloudy, 2 points")).toBeVisible();
    expect(screen.getByText("Best: Monday, Sunny, 3 points")).toBeVisible();
  });

  it("says when a trip was matched to the best weather", () => {
    render(<Review puzzle={CONFLICT} plan={[1, 0]} />);
    expect(screen.getAllByText("Best: you matched it")).toHaveLength(2);
  });

  it("counts a different day with the same weather as matching the best", () => {
    const twin = { weather: [0, 0, 4], trips: [0, 4] };
    render(<Review puzzle={twin} plan={[1, 2]} />);
    expect(screen.getAllByText("Best: you matched it")).toHaveLength(2);
  });
});
