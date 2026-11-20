import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { buildShareText } from "./share";
import { puzzle } from "./fixtures";
import { TrailWordsGame } from "./TrailWordsGame";

function expectNoRawKeys() {
  expect(document.body.textContent).not.toMatch(/words\.[a-z]+\.[a-zA-Z0-9]+/);
}

describe("TrailWordsGame in another language", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-11-16T10:00:00Z"));
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
    document.documentElement.lang = "";
  });

  it("translates the interface and says the words are English", async () => {
    document.documentElement.lang = "de";
    render(<TrailWordsGame />);
    expect(await screen.findByRole("button", { name: "Mischen" })).toBeInTheDocument();
    expect(screen.getByText("Die Wörter in diesem Spiel sind englisch.")).toBeInTheDocument();
    expect(screen.getByText("Anfänger")).toBeInTheDocument();
    expect(screen.getByText(/^0 Punkte · /)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Spiel beenden" })).toBeInTheDocument();
    expectNoRawKeys();
  });

  it("shows a rejection in the page language", async () => {
    document.documentElement.lang = "de";
    render(<TrailWordsGame />);
    await screen.findByRole("button", { name: "Mischen" });
    fireEvent.click(screen.getByRole("button", { name: `${puzzle.centre}, mittlerer Buchstabe` }));
    fireEvent.click(screen.getByRole("button", { name: "Enter" }));
    expect(await screen.findByText("Zu kurz")).toBeInTheDocument();
  });

  it("adds no language note in English", async () => {
    render(<TrailWordsGame />);
    await screen.findByRole("button", { name: "Shuffle" });
    expect(screen.queryByText(/are English/)).not.toBeInTheDocument();
  });

  it("translates the share text, including the rank and game title", () => {
    document.documentElement.lang = "uk";
    const text = buildShareText(puzzle, { puzzleId: "x", found: [], ended: false }, 4);
    expect(text).toBe(`Dailyverse Слова стежки #4 · Новачок · 0/${puzzle.common.size} слів`);
  });
});
