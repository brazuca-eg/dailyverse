import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FoundWords } from "./FoundWords";
import { pangram, plainWord, puzzle } from "./fixtures";

describe("FoundWords", () => {
  it("counts the words, with no list while there are none", () => {
    render(<FoundWords puzzle={puzzle} found={[]} />);
    expect(screen.getByText("0 words found")).toBeInTheDocument();
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });

  it("uses the singular for one word", () => {
    render(<FoundWords puzzle={puzzle} found={[plainWord]} />);
    expect(screen.getByText("1 word found")).toBeInTheDocument();
  });

  it("lists the words alphabetically and marks the pangram", () => {
    render(<FoundWords puzzle={puzzle} found={[pangram, plainWord]} />);
    const items = within(screen.getByRole("list", { hidden: true })).getAllByRole("listitem", {
      hidden: true,
    });
    expect(items.map((item) => item.textContent)).toEqual([pangram, plainWord].sort());
    expect(items.find((item) => item.textContent === pangram)).toHaveClass("found-pangram");
    expect(items.find((item) => item.textContent === plainWord)).not.toHaveClass("found-pangram");
  });

  it("previews the latest words first, at most five", () => {
    const words = puzzle.words.slice(0, 7);
    const { container } = render(<FoundWords puzzle={puzzle} found={words} />);
    expect(container.querySelector(".found-preview")).toHaveTextContent(
      words.slice(-5).reverse().join(" · "),
    );
  });

  it("is a labelled section", () => {
    render(<FoundWords puzzle={puzzle} found={[]} />);
    expect(screen.getByRole("region", { name: "Found words" })).toBeInTheDocument();
  });
});
