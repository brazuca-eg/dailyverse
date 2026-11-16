import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { GameStats } from "../core/streak";
import { createEmptyStats } from "../core/streak";
import { StatsSummary } from "./StatsSummary";

const stats: GameStats = {
  gamesPlayed: 12,
  gamesWon: 9,
  currentStreak: 3,
  maxStreak: 5,
  lastCompletedDay: 10,
};

function statValue(label: string): string {
  return screen.getByText(label).nextElementSibling?.textContent ?? "";
}

describe("StatsSummary", () => {
  it("shows games played, win rate, streak and best streak", () => {
    render(<StatsSummary stats={stats} todayDayIndex={10} />);
    expect(statValue("Played")).toBe("12");
    expect(statValue("Win rate")).toBe("75%");
    expect(statValue("Streak")).toBe("3");
    expect(statValue("Best streak")).toBe("5");
  });

  it("keeps the streak alive on the day after the last game", () => {
    render(<StatsSummary stats={stats} todayDayIndex={11} />);
    expect(statValue("Streak")).toBe("3");
  });

  it("shows a streak of zero once a day has been missed, but keeps the best streak", () => {
    render(<StatsSummary stats={stats} todayDayIndex={12} />);
    expect(statValue("Streak")).toBe("0");
    expect(statValue("Best streak")).toBe("5");
  });

  it("shows zeros for a new player", () => {
    render(<StatsSummary stats={createEmptyStats()} todayDayIndex={4} />);
    expect(statValue("Played")).toBe("0");
    expect(statValue("Win rate")).toBe("0%");
    expect(statValue("Streak")).toBe("0");
  });
});
