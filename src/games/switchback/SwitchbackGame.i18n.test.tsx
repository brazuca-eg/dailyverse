import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { buildShareText } from "./share";
import { SwitchbackGame } from "./SwitchbackGame";

afterEach(() => {
  document.documentElement.lang = "";
});

describe("Switchback in German", () => {
  it("shows translated controls, progress and help with no raw message keys", () => {
    document.documentElement.lang = "de";
    render(<SwitchbackGame />);
    expect(screen.getByText(/^1 von \d+ Feldern · Etappenziel 1 von \d+$/)).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Switchback-Spielfeld" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Rückgängig", hidden: true })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Aufgeben", hidden: true })).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/switch\.[a-z]+\./);
  });

  it("translates the share text and the hint plural", () => {
    document.documentElement.lang = "de";
    const text = buildShareText(
      { puzzleId: "easy:3", path: [0], hints: 2, elapsedSeconds: 72, status: "won" },
      5,
      7,
    );
    expect(text.split("\n")).toEqual([
      "Dailyverse Switchback #7 · 5x5 · Gipfel erreicht",
      "⏱ 1:12 · 💡 2 Tipps",
    ]);
  });

  it("uses the Ukrainian few form for hints", () => {
    document.documentElement.lang = "uk";
    const text = buildShareText(
      { puzzleId: "easy:3", path: [0], hints: 3, elapsedSeconds: 5, status: "lost" },
      5,
      1,
    );
    expect(text).toContain("3 підказки");
  });
});
