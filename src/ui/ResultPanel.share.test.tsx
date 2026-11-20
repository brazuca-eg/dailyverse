import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { recordPlay } from "../core/history";
import { ResultPanel } from "./ResultPanel";

const DAY = 24 * 60 * 60 * 1000;
const TEXT = "Dailyverse Mystery Place #2 2/5\n🟩\nhttps://example.com/mystery-place";

function renderPanel() {
  render(<ResultPanel status="won" score={4} maxScore={5} summary="Done" shareText={TEXT} />);
}

describe("ResultPanel share text", () => {
  afterEach(() => {
    vi.useRealTimers();
    document.documentElement.lang = "";
  });

  it("invites others to beat the result, just before the link", () => {
    renderPanel();
    const lines = (screen.getByText(/Dailyverse Mystery Place #2/).textContent ?? "").split("\n");
    expect(lines).toEqual([
      "Dailyverse Mystery Place #2 2/5",
      "🟩",
      "Think you can beat that?",
      "https://example.com/mystery-place",
    ]);
  });

  it("adds the day streak once it is two days or more", () => {
    recordPlay(
      { game: "a", score: 4, maxScore: 5, won: true },
      undefined,
      new Date(Date.now() - DAY),
    );
    recordPlay({ game: "a", score: 4, maxScore: 5, won: true });
    renderPanel();
    expect(screen.getByText(/Dailyverse Mystery Place #2/).textContent).toContain(
      "🔥 Day streak: 2",
    );
  });

  it("leaves out the streak for a first day", () => {
    recordPlay({ game: "a", score: 4, maxScore: 5, won: true });
    renderPanel();
    expect(screen.getByText(/Dailyverse Mystery Place #2/).textContent).not.toContain("🔥");
  });

  it("is written in the page language", () => {
    document.documentElement.lang = "de";
    renderPanel();
    expect(screen.getByText(/Dailyverse Mystery Place #2/).textContent).toContain(
      "Schaffst du es besser?",
    );
  });
});
