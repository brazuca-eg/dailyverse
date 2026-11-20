import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createEmptyStats } from "../core/streak";
import { recordPlay } from "../core/history";
import { StatsOverview } from "./StatsOverview";

const TODAY = new Date("2026-11-20T10:00:00Z");
const DAY = 24 * 60 * 60 * 1000;

function playOn(daysAgo: number, game: string, score: number, won = true) {
  recordPlay(
    { game, score, maxScore: 5, won },
    undefined,
    new Date(TODAY.getTime() - daysAgo * DAY),
  );
}

function readTile(label: string): string {
  const term = screen.getByText(label, { selector: "dt" });
  return term.nextElementSibling?.textContent ?? "";
}

describe("StatsOverview", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(TODAY);
  });

  afterEach(() => {
    vi.useRealTimers();
    document.documentElement.lang = "";
  });

  it("invites the player to finish a game when there is no history", () => {
    render(<StatsOverview />);
    expect(
      screen.getByText("Finish a game and your streak and points will show up here."),
    ).toBeVisible();
    expect(readTile("Day streak")).toBe("0");
    expect(readTile("Total points")).toBe("0");
  });

  it("shows the streak, points, games, win rate and average", () => {
    playOn(2, "bear-sweeper", 5);
    playOn(1, "bear-sweeper", 4);
    playOn(0, "switchback", 0, false);
    playOn(0, "bear-sweeper", 3);
    render(<StatsOverview />);
    expect(readTile("Day streak")).toBe("3");
    expect(readTile("Best streak")).toBe("3");
    expect(readTile("Total points")).toBe("12");
    expect(readTile("Games played")).toBe("4");
    expect(readTile("Win rate")).toBe("75%");
    expect(readTile("Average score")).toBe("3");
    expect(
      screen.queryByText("Finish a game and your streak and points will show up here."),
    ).toBeNull();
  });

  it("says how many games were finished today", () => {
    playOn(0, "bear-sweeper", 5);
    render(<StatsOverview />);
    expect(screen.getByText("1 of 10 game finished today", { selector: "p" })).toBeVisible();
    expect(
      screen.getByRole("progressbar", { name: "1 of 10 game finished today" }),
    ).toHaveAttribute("value", "1");
  });

  it("uses the plural for several games", () => {
    playOn(0, "bear-sweeper", 5);
    playOn(0, "switchback", 2);
    render(<StatsOverview />);
    expect(screen.getByText("2 of 10 games finished today", { selector: "p" })).toBeVisible();
  });

  it("lists every game with its own results and points", () => {
    playOn(1, "bear-sweeper", 5);
    playOn(0, "bear-sweeper", 2, false);
    localStorage.setItem(
      "dailyverse:bear-sweeper:stats",
      JSON.stringify({ ...createEmptyStats(), maxStreak: 7 }),
    );
    render(<StatsOverview />);
    const rows = screen.getAllByRole("row").slice(1);
    expect(rows).toHaveLength(10);
    const bear = rows.find((row) =>
      within(row).queryByRole("link", { name: "Bear Sweeper" }),
    ) as HTMLElement;
    expect(
      within(bear)
        .getAllByRole("cell")
        .map((cell) => cell.textContent),
    ).toEqual(["2", "1", "7", "7"]);
    const other = rows.find((row) =>
      within(row).queryByRole("link", { name: "Switchback" }),
    ) as HTMLElement;
    expect(
      within(other)
        .getAllByRole("cell")
        .map((cell) => cell.textContent),
    ).toEqual(["0", "0", "0", "0"]);
  });

  it("draws the last 28 days with the number of games on each", () => {
    playOn(0, "bear-sweeper", 5);
    playOn(0, "switchback", 3);
    playOn(27, "bear-sweeper", 1);
    playOn(28, "bear-sweeper", 1);
    render(<StatsOverview />);
    const days = screen.getAllByRole("listitem");
    expect(days).toHaveLength(28);
    expect(days[27]).toHaveAttribute("aria-label", "2026-11-20: 2 games, 8 points");
    expect(days[27]).toHaveTextContent("2");
    expect(days[0]).toHaveAttribute("aria-label", "2026-10-24: 1 game, 1 points");
    expect(days[1]).toHaveAttribute("aria-label", "2026-10-25: 0 games, 0 points");
  });

  it("links each game in the page language", () => {
    document.documentElement.lang = "de";
    render(<StatsOverview />);
    expect(screen.getByRole("link", { name: "Bärensuche" })).toHaveAttribute(
      "href",
      "/de/bear-sweeper/",
    );
    expect(screen.getByText("Tagesserie", { selector: "dt" })).toBeVisible();
  });

  it("links back to all games", () => {
    render(<StatsOverview />);
    expect(screen.getByRole("link", { name: "All games" })).toHaveAttribute("href", "/");
  });

  it("offers to invite friends, sharing the site link in the page language", async () => {
    const user = userEvent.setup();
    document.documentElement.lang = "de";
    render(<StatsOverview />);
    expect(screen.getByRole("heading", { name: "Freunde einladen" })).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Dailyverse teilen" }));
    await waitFor(async () => {
      const copied = await navigator.clipboard.readText();
      expect(copied).toBe(
        `Dailyverse: kleine Tagesspiele, jeden Tag ein neues Rätsel. Spiel mit mir!\n${window.location.origin}/de/`,
      );
    });
  });

  it("mentions the day streak in the invitation when there is one", async () => {
    const user = userEvent.setup();
    playOn(1, "bear-sweeper", 5);
    playOn(0, "bear-sweeper", 4);
    render(<StatsOverview />);
    await user.click(screen.getByRole("button", { name: "Share Dailyverse" }));
    await waitFor(async () => {
      expect(await navigator.clipboard.readText()).toBe(
        `My Dailyverse day streak: 2 🔥 Small daily games, a new puzzle every day. Join me!\n${window.location.origin}/`,
      );
    });
  });
});
