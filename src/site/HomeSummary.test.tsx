import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { recordPlay } from "../core/history";
import { HomeSummary } from "./HomeSummary";

describe("HomeSummary", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-11-20T10:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
    document.documentElement.lang = "";
  });

  it("shows zero progress, no streak and a link to the stats for a new player", () => {
    render(<HomeSummary />);
    expect(screen.getByText("0 of 10 games finished today")).toBeVisible();
    expect(screen.getByText("Day streak").nextElementSibling).toHaveTextContent("0");
    expect(screen.getByRole("link", { name: "My stats" })).toHaveAttribute("href", "/stats/");
  });

  it("shows today's progress, the streak and the points", () => {
    recordPlay({ game: "bear-sweeper", score: 4, maxScore: 5, won: true });
    recordPlay({ game: "switchback", score: 5, maxScore: 5, won: true });
    render(<HomeSummary />);
    expect(screen.getByText("2 of 10 games finished today")).toBeVisible();
    expect(screen.getByText("Day streak").nextElementSibling).toHaveTextContent("1");
    expect(screen.getByText("Total points").nextElementSibling).toHaveTextContent("9");
  });

  it("is written in the page language", () => {
    document.documentElement.lang = "uk";
    render(<HomeSummary />);
    expect(screen.getByText("Сьогодні завершено 0 ігор із 10")).toBeVisible();
    expect(screen.getByRole("link", { name: "Моя статистика" })).toHaveAttribute(
      "href",
      "/uk/stats/",
    );
  });
});
