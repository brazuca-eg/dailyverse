import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { TentsGame } from "./TentsGame";
import { buildShareText } from "./share";
import { createInitialState } from "./game";

const LAUNCH_DATE = new Date("2026-11-16T00:00:00Z");

describe("TentsGame in German", () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.lang = "de";
  });

  afterEach(() => {
    document.documentElement.lang = "";
  });

  it("shows the controls, board and rules in German without raw keys", () => {
    render(<TentsGame launchDate={LAUNCH_DATE} />);
    const options = { hidden: true };
    expect(screen.getByRole("button", { name: "Rückgängig", ...options })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Aufgeben", ...options })).toBeTruthy();
    expect(
      screen.getByRole("grid", { name: /^Zelte-und-Bäume-Feld, \d+ mal \d+$/, ...options }),
    ).toBeTruthy();
    expect(screen.getByRole("button", { name: /^Zeile 1, Spalte 1,/, ...options })).toBeTruthy();
    expect(screen.getByText("Zelte berühren sich nie, auch nicht an einer Ecke.")).toBeTruthy();
    expect(document.body.textContent).not.toMatch(/tents\.[a-z]+\./);
  });

  it("asks for a second tap in German before giving up", () => {
    render(<TentsGame launchDate={LAUNCH_DATE} />);
    fireEvent.click(screen.getByRole("button", { name: "Aufgeben", hidden: true }));
    expect(screen.getByRole("button", { name: "Nochmal tippen", hidden: true })).toBeTruthy();
  });

  it("translates the game name and plurals in the share text", () => {
    const state = { ...createInitialState("2000:easy", 6), status: "won" as const, checks: 2 };
    expect(buildShareText(state, 6, 4).split("\n")).toEqual([
      "Dailyverse Zelte und Bäume #4 6x6 ⛺",
      "⏱ 0:00 · 🔎 2 Prüfungen · 💡 0 Tipps",
    ]);
  });
});
