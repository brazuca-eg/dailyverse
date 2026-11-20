import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { BearSweeperGame } from "./BearSweeperGame";
import { buildDailyBearRound } from "./daily";
import { createInitialState } from "./game";
import { buildShareText } from "./share";
import { t } from "./messages";

afterEach(() => {
  document.documentElement.lang = "";
});

describe("Bear Sweeper in German", () => {
  it("shows the rules, board and controls in German without raw keys", () => {
    document.documentElement.lang = "de";
    render(<BearSweeperGame />);
    expect(screen.getByText(/Rund um dein Camp verstecken sich Bären/)).toBeInTheDocument();
    expect(
      screen.getByRole("grid", { name: "Bärensuche-Spielfeld", hidden: true }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: "Noch 3 von 3 Leben", hidden: true }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Tipp", hidden: true })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Aufgeben", hidden: true })).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/bear\.[a-z]+\./);
  });

  it("writes the share text in German", () => {
    document.documentElement.lang = "de";
    const { puzzle } = buildDailyBearRound(0);
    const state = { ...createInitialState("easy:0", puzzle), status: "won" as const };
    expect(buildShareText(state, 7, 3).split("\n")).toEqual([
      "Dailyverse Bärensuche #3 · 7x7 · ⏱ 0:00 · alles frei",
      "🐻 0 Begegnungen · 💡 0 Tipps",
    ]);
  });

  it("picks the right Ukrainian plural form for lives", () => {
    document.documentElement.lang = "uk";
    expect(t("bear.notice.hit", { count: 1 })).toBe("Ведмідь! Залишилось 1 життя.");
    expect(t("bear.notice.hit", { count: 5 })).toBe("Ведмідь! Залишилось 5 життів.");
  });
});
