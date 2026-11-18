import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RankBar } from "./RankBar";

describe("RankBar", () => {
  it("shows the rank, the points and what is needed for the next rank", () => {
    render(<RankBar score={0} maxScore={100} />);
    expect(screen.getByText("Beginner")).toBeInTheDocument();
    expect(screen.getByText("0 points · 15 to Hiker")).toBeInTheDocument();
  });

  it("uses the singular for one point", () => {
    render(<RankBar score={1} maxScore={100} />);
    expect(screen.getByText("1 point · 14 to Hiker")).toBeInTheDocument();
  });

  it("is a progress bar with a readable value", () => {
    render(<RankBar score={40} maxScore={100} />);
    const bar = screen.getByRole("progressbar", { name: "Rank progress" });
    expect(bar).toHaveAttribute("aria-valuenow", "40");
    expect(bar).toHaveAttribute("aria-valuemax", "70");
    expect(bar).toHaveAttribute("aria-valuetext", "Trekker, 40 points, 10 to Ranger");
  });

  it("fills in proportion to the Summit score", () => {
    const { container } = render(<RankBar score={35} maxScore={100} />);
    expect(container.querySelector(".rank-fill")).toHaveStyle({ width: "50%" });
  });

  it("is full at Summit, and says so", () => {
    const { container } = render(<RankBar score={90} maxScore={100} />);
    expect(screen.getByText("Summit")).toBeInTheDocument();
    expect(screen.getByText("90 points · Top rank reached")).toBeInTheDocument();
    expect(container.querySelector(".rank-fill")).toHaveStyle({ width: "100%" });
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "70");
  });

  it("marks where each rank starts", () => {
    const { container } = render(<RankBar score={0} maxScore={100} />);
    expect(container.querySelectorAll(".rank-mark")).toHaveLength(4);
  });

  it("places the marks in proportion, with Summit at the end", () => {
    const { container } = render(<RankBar score={0} maxScore={100} />);
    const positions = [...container.querySelectorAll<HTMLElement>(".rank-mark")].map((mark) =>
      Math.round(Number.parseFloat(mark.style.left)),
    );
    expect(positions).toEqual([21, 43, 71, 100]);
  });
});
