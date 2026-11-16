import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { countries } from "../../core/countries";
import type { GuessRecord } from "./game";
import { GuessHistory } from "./GuessHistory";

const wrongGuess: GuessRecord = {
  countryCode: "PE",
  feedback: { isCorrect: false, distanceKm: 12087, direction: "NE" },
};
const correctGuess: GuessRecord = { countryCode: "EG", feedback: { isCorrect: true } };

describe("GuessHistory", () => {
  it("shows nothing before the first guess", () => {
    const { container } = render(<GuessHistory guesses={[]} countries={countries} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows a wrong guess with its distance, direction and closeness", () => {
    render(<GuessHistory guesses={[wrongGuess]} countries={countries} />);
    const row = screen.getByRole("listitem");
    expect(within(row).getByText("Peru")).toBeInTheDocument();
    expect(within(row).getByText("12,087 km")).toBeInTheDocument();
    expect(within(row).getByText("40%")).toBeInTheDocument();
    expect(within(row).getByRole("img", { name: "Target is north-east" })).toBeInTheDocument();
  });

  it("shows a correct guess as correct, with no distance or direction", () => {
    render(<GuessHistory guesses={[correctGuess]} countries={countries} />);
    const row = screen.getByRole("listitem");
    expect(within(row).getByText("Egypt")).toBeInTheDocument();
    expect(within(row).getByText("Correct")).toBeInTheDocument();
    expect(within(row).queryByText(/km/)).not.toBeInTheDocument();
    expect(within(row).queryByRole("img")).not.toBeInTheDocument();
    expect(row).toHaveClass("guess-correct");
  });

  it("lists guesses in the order they were made", () => {
    render(<GuessHistory guesses={[wrongGuess, correctGuess]} countries={countries} />);
    const rows = screen.getAllByRole("listitem");
    expect(rows).toHaveLength(2);
    expect(within(rows[0]).getByText("Peru")).toBeInTheDocument();
    expect(within(rows[1]).getByText("Egypt")).toBeInTheDocument();
  });

  it("falls back to the country code for an unknown country", () => {
    const unknown: GuessRecord = { ...wrongGuess, countryCode: "ZZ" };
    render(<GuessHistory guesses={[unknown]} countries={countries} />);
    expect(screen.getByText("ZZ")).toBeInTheDocument();
  });

  it("describes every compass direction for screen readers", () => {
    const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"] as const;
    const labels = [
      "north",
      "north-east",
      "east",
      "south-east",
      "south",
      "south-west",
      "west",
      "north-west",
    ];
    const guesses: GuessRecord[] = directions.map((direction, index) => ({
      countryCode: countries[index].code,
      feedback: { isCorrect: false, distanceKm: 1000, direction },
    }));
    render(<GuessHistory guesses={guesses} countries={countries} />);
    labels.forEach((label) => {
      expect(screen.getByRole("img", { name: `Target is ${label}` })).toBeInTheDocument();
    });
  });
});
