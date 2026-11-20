import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { calculateDaysSinceLaunch } from "../../core/daily";
import { PEAK_LAUNCH_DATE } from "./data";
import { puzzle } from "./fixtures";
import { loadLocalNames } from "./localNames";
import { buildDailyPeakPuzzle } from "./puzzle";
import { formatValue } from "./format";
import { PeakOrderGame } from "./PeakOrderGame";
import { buildShareText } from "./share";

afterEach(() => {
  document.documentElement.lang = "";
});

function todayIndex(): number {
  return calculateDaysSinceLaunch(new Date(), PEAK_LAUNCH_DATE);
}

describe("PeakOrderGame in German", () => {
  it("shows the prompt, the check button and the rows in German", () => {
    document.documentElement.lang = "de";
    render(<PeakOrderGame />);
    expect(screen.getByText(/^Ordne diese /)).toBeInTheDocument();
    expect(screen.getByText("Reihenfolge prüfen")).toBeInTheDocument();
    expect(
      screen.getAllByRole("button", { name: /, Position \d von 5/, hidden: true }),
    ).toHaveLength(5);
    expect(
      screen.getByRole("img", { name: "5 Prüfungen übrig", hidden: true }),
    ).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/peak\.[a-z]+\./);
  });

  it("announces a selection in German", () => {
    document.documentElement.lang = "de";
    render(<PeakOrderGame />);
    fireEvent.click(screen.getAllByRole("button", { name: /, Position 1 von 5/, hidden: true })[0]);
    expect(screen.getByRole("status", { hidden: true })).toHaveTextContent(/ausgewählt/);
  });

  it("formats values with the German number format and unit", () => {
    document.documentElement.lang = "de";
    expect(formatValue(4807, "mountains")).toBe("4.807 m");
    expect(formatValue(386400, "lakes")).toBe("386.400 km²");
  });

  it("translates the share header, including the game title", () => {
    document.documentElement.lang = "de";
    const text = buildShareText(puzzle, { puzzleId: puzzle.id, order: [], history: [] }, 4);
    expect(text.split("\n")[0]).toMatch(/^Dailyverse Gipfelreihe #4 · .+ · X\/5$/);
  });
});

describe("PeakOrderGame in Ukrainian", () => {
  it("uses Ukrainian plural forms for the checks left", () => {
    document.documentElement.lang = "uk";
    render(<PeakOrderGame />);
    expect(
      screen.getByRole("img", { name: "Залишилось 5 перевірок", hidden: true }),
    ).toBeInTheDocument();
  });
});

describe("PeakOrderGame names in another language", () => {
  it("shows the Ukrainian names of the items once they are loaded", async () => {
    document.documentElement.lang = "uk";
    const daily = buildDailyPeakPuzzle(todayIndex());
    const names = await loadLocalNames("uk");
    const translated = daily.items.map((item) => names?.[daily.category][item.name] ?? item.name);
    expect(translated.some((name, index) => name !== daily.items[index].name)).toBe(true);
    render(<PeakOrderGame />);
    await waitFor(() => {
      translated.forEach((name) => {
        expect(
          screen.getAllByRole("button", {
            name: new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
            hidden: true,
          }).length,
        ).toBeGreaterThan(0);
      });
    });
  });

  it("shows the English names in English", () => {
    render(<PeakOrderGame />);
    const daily = buildDailyPeakPuzzle(todayIndex());
    daily.items.forEach((item) => {
      expect(screen.getAllByText(item.name, { exact: false }).length).toBeGreaterThan(0);
    });
  });
});
