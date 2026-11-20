import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { countries } from "../../core/countries";
import { CluesList } from "./CluesList";
import { puzzles } from "./data";
import { MysteryPlaceGame } from "./MysteryPlaceGame";

const LAUNCH_DATE = new Date("2026-11-16T00:00:00Z");

afterEach(() => {
  document.documentElement.lang = "";
});

describe("Mystery Place in German", () => {
  it("translates the clue list labels and kinds", () => {
    document.documentElement.lang = "de";
    render(<CluesList clues={puzzles[1].clues} visibleCount={1} highlightIndex={0} />);
    expect(screen.getByRole("list", { name: "Hinweise" })).toBeInTheDocument();
    expect(screen.getByLabelText("Hinweis 2, gesperrt")).toBeInTheDocument();
    expect(screen.getAllByText("Gesperrt")).toHaveLength(4);
    expect(document.body.textContent).not.toMatch(/mystery\.\w+/);
  });

  it("translates the rules and the example country", () => {
    document.documentElement.lang = "de";
    render(<MysteryPlaceGame puzzles={puzzles} countries={countries} launchDate={LAUNCH_DATE} />);
    expect(screen.getByText("Finde das geheime Land. Du hast 5 Versuche.")).toBeInTheDocument();
    expect(screen.getByText("Spanien")).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/mystery\.\w+/);
  });
});
