import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FIT } from "./catalogue";
import { FitGuide } from "./FitGuide";

describe("FitGuide", () => {
  it("has a column for every weather", () => {
    render(<FitGuide trips={[0, 4]} />);
    ["Sunny", "Cloudy", "Rainy", "Windy", "Snowy"].forEach((label) => {
      expect(screen.getByRole("columnheader", { name: label })).toBeVisible();
    });
  });

  it("has a row only for the trips of the day, with their points", () => {
    render(<FitGuide trips={[1, 4]} />);
    const rows = screen.getAllByRole("row").slice(1);
    expect(rows).toHaveLength(2);
    const kayak = within(rows[0])
      .getAllByRole("cell")
      .map((cell) => cell.textContent);
    expect(kayak).toEqual(FIT[1].map(String));
    expect(within(rows[0]).getByRole("rowheader")).toHaveTextContent("Kayak");
    expect(within(rows[1]).getByRole("rowheader")).toHaveTextContent("Ski");
  });
});
