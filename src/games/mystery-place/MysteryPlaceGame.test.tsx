import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { countries } from "../../core/countries";
import { requireCountry } from "../../core/testing";
import { puzzles } from "./data";
import { MysteryPlaceGame } from "./MysteryPlaceGame";

const LAUNCH_DATE = new Date("2026-11-15T00:00:00Z");
const puzzle = puzzles[1];
const answer = requireCountry(puzzle.country);

function renderGame() {
  return render(
    <MysteryPlaceGame puzzles={puzzles} countries={countries} launchDate={LAUNCH_DATE} />,
  );
}

async function guess(user: ReturnType<typeof userEvent.setup>, name: string) {
  await user.type(screen.getByRole("combobox"), `${name}{Enter}`);
  await user.keyboard("{Enter}");
}

function wrongCountryNames(count: number): string[] {
  return countries
    .filter((country) => country.code !== answer.code && country.name.length > 6)
    .slice(0, count)
    .map((country) => country.name);
}

function findDialog(title: string): HTMLElement {
  const dialog = screen.getByRole("heading", { name: title, hidden: true }).closest("dialog");
  if (!dialog) {
    throw new Error(`No dialog titled ${title}`);
  }
  return dialog;
}

async function dismissHelp(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: /Let's play|Start|Got it/i }));
}

describe("MysteryPlaceGame", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-11-16T10:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("opens the how-to-play dialog for a first-time player and not again afterwards", async () => {
    const user = userEvent.setup();
    const first = renderGame();
    expect(findDialog("How to play")).toHaveAttribute("open");
    await dismissHelp(user);
    expect(findDialog("How to play")).not.toHaveAttribute("open");
    first.unmount();

    renderGame();
    expect(findDialog("How to play")).not.toHaveAttribute("open");
  });

  it("starts with only the first clue unlocked", async () => {
    const user = userEvent.setup();
    renderGame();
    await dismissHelp(user);
    expect(screen.getByText(puzzle.clues[0].text)).toBeInTheDocument();
    expect(screen.queryByText(puzzle.clues[1].text)).not.toBeInTheDocument();
  });

  it("unlocks the next clue after a wrong guess and shows distance feedback", async () => {
    const user = userEvent.setup();
    renderGame();
    await dismissHelp(user);
    const [wrong] = wrongCountryNames(1);

    await guess(user, wrong);

    expect(screen.getByText(puzzle.clues[1].text)).toBeInTheDocument();
    expect(screen.getByText(wrong)).toBeInTheDocument();
    expect(
      within(screen.getByRole("list", { name: "Your guesses" })).getByText(/ km$/),
    ).toBeInTheDocument();
  });

  it("wins with the right country: reveals the answer, score and share button", async () => {
    const user = userEvent.setup();
    renderGame();
    await dismissHelp(user);

    await guess(user, answer.name);

    expect(screen.getByRole("heading", { name: "You got it!" })).toBeInTheDocument();
    expect(screen.getByText("5 / 5 points")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Share result" })).toBeInTheDocument();
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
  });

  it("loses after five wrong guesses and reveals every clue", async () => {
    const user = userEvent.setup();
    renderGame();
    await dismissHelp(user);

    for (const name of wrongCountryNames(5)) {
      await guess(user, name);
    }

    expect(screen.getByRole("heading", { name: "Not this time" })).toBeInTheDocument();
    puzzle.clues.forEach((clue) => expect(screen.getByText(clue.text)).toBeInTheDocument());
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
  });

  it("restores a finished game when the page is opened again", async () => {
    const user = userEvent.setup();
    const first = renderGame();
    await dismissHelp(user);
    await guess(user, answer.name);
    first.unmount();

    renderGame();

    expect(screen.getByRole("heading", { name: "You got it!" })).toBeInTheDocument();
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
  });

  it("restores guesses in progress", async () => {
    const user = userEvent.setup();
    const first = renderGame();
    await dismissHelp(user);
    const [wrong] = wrongCountryNames(1);
    await guess(user, wrong);
    first.unmount();

    renderGame();

    expect(screen.getByText(wrong)).toBeInTheDocument();
    expect(screen.getByText(puzzle.clues[1].text)).toBeInTheDocument();
    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });

  it("records the result in the stats dialog", async () => {
    const user = userEvent.setup();
    renderGame();
    await dismissHelp(user);
    await guess(user, answer.name);

    await user.click(screen.getByRole("button", { name: "Your stats" }));

    const dialog = findDialog("Your stats");
    expect(dialog).toHaveAttribute("open");
    expect(within(dialog).getByText("Played").nextElementSibling).toHaveTextContent("1");
    expect(within(dialog).getByText("Win rate").nextElementSibling).toHaveTextContent("100%");
  });

  it("reopens the help from the toolbar", async () => {
    const user = userEvent.setup();
    renderGame();
    await dismissHelp(user);

    await user.click(screen.getByRole("button", { name: "How to play" }));

    expect(findDialog("How to play")).toHaveAttribute("open");
  });
});
