import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { puzzles } from "./data";
import { CluesList } from "./CluesList";

const clues = puzzles[1].clues;

describe("CluesList", () => {
  it("shows the unlocked clues and locks the rest", () => {
    render(<CluesList clues={clues} visibleCount={2} highlightIndex={1} />);
    expect(screen.getByText(clues[0].text)).toBeInTheDocument();
    expect(screen.getByText(clues[1].text)).toBeInTheDocument();
    expect(screen.queryByText(clues[2].text)).not.toBeInTheDocument();
    ["Clue 3, locked", "Clue 4, locked", "Clue 5, locked"].forEach((label) => {
      expect(screen.getByLabelText(label)).toBeInTheDocument();
    });
    expect(screen.queryByLabelText("Clue 1, locked")).not.toBeInTheDocument();
  });

  it("keeps every clue in order with its number", () => {
    render(<CluesList clues={clues} visibleCount={5} highlightIndex={null} />);
    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(5);
    items.forEach((item, index) => {
      expect(within(item).getByText(String(index + 1))).toBeInTheDocument();
      expect(within(item).getByText(clues[index].text)).toBeInTheDocument();
    });
  });

  it("highlights only the newest clue", () => {
    render(<CluesList clues={clues} visibleCount={3} highlightIndex={2} />);
    const items = screen.getAllByRole("listitem");
    expect(items[2]).toHaveClass("clue-new");
    expect(items[0]).not.toHaveClass("clue-new");
    expect(items[1]).not.toHaveClass("clue-new");
  });

  it("highlights nothing once the game is over", () => {
    const { container } = render(
      <CluesList clues={clues} visibleCount={5} highlightIndex={null} />,
    );
    expect(container.querySelector(".clue-new")).not.toBeInTheDocument();
  });

  it("labels each clue with its kind in the matching colour", () => {
    render(<CluesList clues={clues} visibleCount={5} highlightIndex={null} />);
    const items = screen.getAllByRole("listitem");
    expect(within(items[0]).getByText(/geography/)).toHaveClass("kind-chip", "hue-green");
    expect(within(items[1]).getByText(/history/)).toHaveClass("kind-chip", "hue-rose");
    expect(within(items[2]).getByText(/culture/)).toHaveClass("kind-chip", "hue-purple");
  });
});
