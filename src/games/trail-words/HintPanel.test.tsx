import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { commonWords, pangram, puzzle } from "./fixtures";
import { HintPanel } from "./HintPanel";

describe("HintPanel", () => {
  it("counts the common words left and the pangram", () => {
    render(<HintPanel puzzle={puzzle} found={[]} />);
    expect(
      screen.getByText(`${commonWords.length} common words left, including 1 pangram.`),
    ).toBeInTheDocument();
  });

  it("shows a table of counts by first letter and length, with a total", () => {
    render(<HintPanel puzzle={puzzle} found={[]} />);
    const letter = commonWords[0][0];
    const table = screen.getByRole("table", { hidden: true });
    const row = within(table)
      .getByRole("rowheader", { name: letter, hidden: true })
      .closest("tr") as HTMLElement;
    const expectedTotal = commonWords.filter((word) => word[0] === letter).length;
    const cells = within(row).getAllByRole("cell", { hidden: true });
    expect(cells[cells.length - 1]).toHaveTextContent(String(expectedTotal));
  });

  it("never shows a word", () => {
    const { container } = render(<HintPanel puzzle={puzzle} found={[]} />);
    commonWords
      .filter((word) => word.length > 5)
      .forEach((word) => expect(container).not.toHaveTextContent(word));
  });

  it("drops the pangram note once it is found", () => {
    render(<HintPanel puzzle={puzzle} found={[pangram]} />);
    expect(screen.getByText(`${commonWords.length - 1} common words left.`)).toBeInTheDocument();
  });

  it("says so when every common word is found", () => {
    render(<HintPanel puzzle={puzzle} found={commonWords} />);
    expect(screen.getByText("You have found every common word.")).toBeInTheDocument();
    expect(screen.queryByRole("table", { hidden: true })).not.toBeInTheDocument();
  });
});
