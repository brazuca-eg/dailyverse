import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { countries } from "../../core/countries";
import { applyGuess } from "../../core/guessing";
import { requireCountry } from "../../core/testing";
import { findFlagFact } from "./facts";
import { FlagGame } from "./FlagGame";
import { createInitialState } from "./game";
import { flagStorage } from "./persistence";
import type { FlagEntry } from "./types";

const LAUNCH_DATE = new Date("2026-11-16T00:00:00Z");
const entry: FlagEntry = { code: "PT", difficulty: "medium", focus: { x: 0.3, y: 0.5 } };
const schedule = [entry];
const wrongNames = ["Australia", "Egypt", "Japan", "Switzerland", "Brazil"];

function renderGame(flags: readonly FlagEntry[] = schedule) {
  return render(<FlagGame schedule={flags} countries={countries} launchDate={LAUNCH_DATE} />);
}

type User = ReturnType<typeof userEvent.setup>;

async function guess(user: User, name: string) {
  await user.type(screen.getByRole("combobox"), `${name}{Enter}`);
  await user.keyboard("{Enter}");
}

async function dismissHelp(user: User) {
  await user.click(screen.getByRole("button", { name: "Start playing" }));
}

function findDialog(title: string): HTMLElement {
  const dialog = screen.getByRole("heading", { name: title, hidden: true }).closest("dialog");
  if (!dialog) {
    throw new Error(`No dialog titled ${title}`);
  }
  return dialog;
}

function readViewer(): HTMLImageElement {
  const image = screen.getByRole("img", { name: /Mystery flag/ }).querySelector("img");
  if (!image) {
    throw new Error("The flag image is missing");
  }
  return image;
}

describe("FlagGame", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-11-16T10:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows how to play on the first visit only", async () => {
    const user = userEvent.setup();
    const first = renderGame();
    expect(findDialog("How to play")).toHaveAttribute("open");
    await dismissHelp(user);
    expect(findDialog("How to play")).not.toHaveAttribute("open");
    first.unmount();

    renderGame();
    expect(findDialog("How to play")).not.toHaveAttribute("open");
  });

  it("does not interrupt a player who already has guesses with the how-to-play dialog", () => {
    const saved = applyGuess(
      createInitialState("PT", 0),
      requireCountry("ES"),
      requireCountry("PT"),
    );
    flagStorage.saveState(0, saved);
    renderGame();
    expect(findDialog("How to play")).not.toHaveAttribute("open");
  });

  it("starts with a close-up of the flag and does not name the country", async () => {
    const user = userEvent.setup();
    renderGame();
    await dismissHelp(user);
    expect(screen.getByRole("img", { name: "Mystery flag, view 1 of 5" })).toBeInTheDocument();
    expect(readViewer().style.width).toBe("400%");
    expect(screen.queryByText("Portugal")).not.toBeInTheDocument();
  });

  it("never shows a country's flag emoji while typing or in the guess list", async () => {
    const user = userEvent.setup();
    renderGame();
    await dismissHelp(user);
    await user.type(screen.getByRole("combobox"), "Spa");
    expect(screen.getByRole("option")).toHaveTextContent("Spain");
    expect(screen.getByRole("option")).not.toHaveTextContent("🇪🇸");
    await user.keyboard("{Enter}{Enter}");
    const history = screen.getByRole("list", { name: "Your guesses" });
    expect(within(history).getByText("Spain")).toBeInTheDocument();
    expect(history).not.toHaveTextContent("🇪🇸");
  });

  it("zooms out after each wrong guess until the full flag", async () => {
    const user = userEvent.setup();
    renderGame();
    await dismissHelp(user);

    await guess(user, wrongNames[0]);
    expect(readViewer().style.width).toBe("200%");

    await guess(user, wrongNames[1]);
    expect(readViewer().style.filter).toBe("blur(14px)");

    await guess(user, wrongNames[2]);
    expect(readViewer().style.filter).toBe("grayscale(1)");

    await guess(user, wrongNames[3]);
    expect(screen.getByRole("img", { name: "Mystery flag, view 5 of 5" })).toBeInTheDocument();
    expect(readViewer().style.filter).toBe("none");
    expect(readViewer().style.width).toBe("100%");
  });

  it("shows distance feedback for a wrong guess", async () => {
    const user = userEvent.setup();
    renderGame();
    await dismissHelp(user);
    await guess(user, "Spain");
    const history = screen.getByRole("list", { name: "Your guesses" });
    expect(within(history).getByText("Spain")).toBeInTheDocument();
    expect(within(history).getByText(/ km$/)).toBeInTheDocument();
  });

  it("wins with the right country and offers a share text without the flag", async () => {
    const user = userEvent.setup();
    renderGame();
    await dismissHelp(user);
    await guess(user, "Spain");
    await guess(user, "Portugal");

    expect(screen.getByRole("heading", { name: "You got it!" })).toBeInTheDocument();
    expect(screen.getByText("4 / 5 points")).toBeInTheDocument();
    expect(screen.getByText(/Dailyverse Flag Fragment #1 2\/5/)).toBeInTheDocument();
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
    expect(readViewer().style.width).toBe("100%");
  });

  it("shows a fact about the flag with a link to its source once the round is over", async () => {
    const user = userEvent.setup();
    renderGame();
    await dismissHelp(user);
    await guess(user, "Portugal");

    const fact = findFlagFact("PT");
    expect(fact).not.toBeNull();
    expect(screen.getByText(fact?.funFact ?? "")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Source/ })).toHaveAttribute("href", fact?.sourceUrl);
  });

  it("does not show the fact while the round is still being played", async () => {
    const user = userEvent.setup();
    renderGame();
    await dismissHelp(user);
    expect(screen.queryByText(findFlagFact("PT")?.funFact ?? "")).not.toBeInTheDocument();
  });

  it("loses after five wrong guesses and shows the full flag with the answer", async () => {
    const user = userEvent.setup();
    renderGame();
    await dismissHelp(user);
    for (const name of wrongNames) {
      await guess(user, name);
    }

    expect(screen.getByRole("heading", { name: "Not this time" })).toBeInTheDocument();
    expect(screen.getByText("Portugal")).toBeInTheDocument();
    expect(screen.getByText(/Dailyverse Flag Fragment #1 X\/5/)).toBeInTheDocument();
    expect(readViewer().style.filter).toBe("none");
  });

  it("restores a round in progress after a reload", async () => {
    const user = userEvent.setup();
    const first = renderGame();
    await dismissHelp(user);
    await guess(user, "Spain");
    first.unmount();

    renderGame();
    expect(screen.getByText("Spain")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Mystery flag, view 2 of 5" })).toBeInTheDocument();
    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });

  it("restores a finished round after a reload", async () => {
    const user = userEvent.setup();
    const first = renderGame();
    await dismissHelp(user);
    await guess(user, "Portugal");
    first.unmount();

    renderGame();
    expect(screen.getByRole("heading", { name: "You got it!" })).toBeInTheDocument();
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
  });

  it("records the result in its own stats", async () => {
    const user = userEvent.setup();
    renderGame();
    await dismissHelp(user);
    await guess(user, "Portugal");

    await user.click(screen.getByRole("button", { name: "Your stats" }));
    const dialog = findDialog("Your stats");
    expect(within(dialog).getByText("Played").nextElementSibling).toHaveTextContent("1");
    expect(within(dialog).getByText("Win rate").nextElementSibling).toHaveTextContent("100%");
    expect(localStorage.getItem("dailyverse:flag-fragment:stats")).not.toBeNull();
    expect(localStorage.getItem("dailyverse:mystery-place:stats")).toBeNull();
  });

  it("shows the next flag on the next day", async () => {
    const user = userEvent.setup();
    const twoFlags: FlagEntry[] = [entry, { ...entry, code: "ES" }];
    const first = renderGame(twoFlags);
    await dismissHelp(user);
    await guess(user, "Portugal");
    first.unmount();

    vi.setSystemTime(new Date("2026-11-17T10:00:00Z"));
    renderGame(twoFlags);
    expect(screen.queryByRole("heading", { name: "You got it!" })).not.toBeInTheDocument();
    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });

  it("explains when today's flag cannot be loaded", () => {
    renderGame([{ ...entry, code: "ZZ" }]);
    expect(screen.getByText("Today's flag could not be loaded.")).toBeInTheDocument();
  });
});
