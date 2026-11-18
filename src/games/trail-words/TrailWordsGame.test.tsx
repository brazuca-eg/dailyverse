import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { findWinningWords, plainWord, puzzle } from "./fixtures";
import { TrailWordsGame } from "./TrailWordsGame";

function findDialog(title: string): HTMLElement {
  const dialog = screen.getByRole("heading", { name: title, hidden: true }).closest("dialog");
  if (!dialog) {
    throw new Error(`No dialog titled ${title}`);
  }
  return dialog;
}

async function renderGame() {
  const view = render(<TrailWordsGame />);
  await screen.findByRole("button", { name: "Shuffle" });
  return view;
}

function dismissHelp() {
  fireEvent.click(screen.getByRole("button", { name: "Start playing" }));
}

function typeAndEnter(word: string) {
  [...word].forEach((key) => fireEvent.keyDown(document, { key }));
  fireEvent.keyDown(document, { key: "Enter" });
}

function readFoundCount(): string {
  return screen.getByText(/words? found$/).textContent ?? "";
}

describe("TrailWordsGame", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-11-16T10:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows the board straight away and the game once the words have loaded", async () => {
    render(<TrailWordsGame />);
    expect(screen.getByRole("status")).toHaveTextContent("Loading the word list");
    screen
      .getAllByRole("button", { name: /^[a-z]/ })
      .forEach((button) => expect(button).toBeDisabled());
    expect(await screen.findByRole("button", { name: "Shuffle" })).toBeEnabled();
    expect(screen.getByRole("button", { name: `${puzzle.centre}, centre letter` })).toBeEnabled();
  });

  it("opens the how-to-play dialog for a first-time player and not again afterwards", async () => {
    const first = await renderGame();
    expect(findDialog("How to play")).toHaveAttribute("open");
    dismissHelp();
    expect(findDialog("How to play")).not.toHaveAttribute("open");
    first.unmount();
    await renderGame();
    expect(findDialog("How to play")).not.toHaveAttribute("open");
  });

  it("starts at Beginner with no words found", async () => {
    await renderGame();
    dismissHelp();
    expect(screen.getByText("Beginner")).toBeInTheDocument();
    expect(readFoundCount()).toBe("0 words found");
  });

  it("builds a word from taps on the letters and submits it with the Enter button", async () => {
    await renderGame();
    dismissHelp();
    [...plainWord].forEach((letter) => {
      const name = letter === puzzle.centre ? `${letter}, centre letter` : letter;
      fireEvent.click(screen.getByRole("button", { name }));
    });
    expect(screen.getByLabelText(`Your word: ${plainWord}`)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Enter" }));
    expect(readFoundCount()).toBe("1 word found");
    expect(screen.getByRole("status")).toHaveTextContent("+1");
  });

  it("plays with the physical keyboard", async () => {
    await renderGame();
    dismissHelp();
    typeAndEnter(plainWord);
    expect(readFoundCount()).toBe("1 word found");
    typeAndEnter("zzzz");
    expect(screen.getByRole("status")).toHaveTextContent("Bad letters");
    expect(readFoundCount()).toBe("1 word found");
  });

  it("deletes with the Delete button", async () => {
    await renderGame();
    dismissHelp();
    fireEvent.click(screen.getByRole("button", { name: puzzle.outer[0] }));
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    expect(screen.getByLabelText("Your word is empty")).toBeInTheDocument();
  });

  it("wins at Ranger, shows the result and a share button, and lets the player carry on", async () => {
    await renderGame();
    dismissHelp();
    findWinningWords().forEach(typeAndEnter);
    expect(screen.getByRole("heading", { name: "Well climbed!" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Share result" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Shuffle" })).toBeInTheDocument();
  });

  it("ends the game after two taps and shows the missed words", async () => {
    await renderGame();
    dismissHelp();
    typeAndEnter(plainWord);
    fireEvent.click(screen.getByRole("button", { name: "End game" }));
    fireEvent.click(screen.getByRole("button", { name: "Tap again to end the game" }));
    expect(screen.getByText(`Words you missed (${puzzle.words.length - 1})`)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Shuffle" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "End game" })).not.toBeInTheDocument();
  });

  it("restores the game when the page is opened again", async () => {
    const first = await renderGame();
    dismissHelp();
    typeAndEnter(plainWord);
    first.unmount();
    await renderGame();
    expect(readFoundCount()).toBe("1 word found");
  });

  it("does not take keys while a dialog is open", async () => {
    await renderGame();
    expect(findDialog("How to play")).toHaveAttribute("open");
    typeAndEnter(plainWord);
    dismissHelp();
    expect(readFoundCount()).toBe("0 words found");
  });

  it("records the result in the stats dialog", async () => {
    await renderGame();
    dismissHelp();
    findWinningWords().forEach(typeAndEnter);
    fireEvent.click(screen.getByRole("button", { name: "Your stats" }));
    const dialog = findDialog("Your stats");
    expect(dialog).toHaveAttribute("open");
    expect(within(dialog).getByText("Played").nextElementSibling).toHaveTextContent("1");
    expect(within(dialog).getByText("Win rate").nextElementSibling).toHaveTextContent("100%");
  });

  it("reopens the help from the toolbar", async () => {
    await renderGame();
    dismissHelp();
    fireEvent.click(screen.getByRole("button", { name: "How to play" }));
    expect(findDialog("How to play")).toHaveAttribute("open");
  });

  it("shuffles the outer letters on request and keeps the centre", async () => {
    await renderGame();
    dismissHelp();
    const readOrder = () =>
      screen
        .getAllByRole("button", { name: /^[a-z](, centre letter)?$/ })
        .map((button) => button.getAttribute("aria-label"));
    const before = readOrder();
    let changed = false;
    for (let attempt = 0; attempt < 10 && !changed; attempt += 1) {
      act(() => {
        fireEvent.click(screen.getByRole("button", { name: "Shuffle" }));
      });
      changed = readOrder().join() !== before.join();
    }
    expect(changed).toBe(true);
    expect(
      screen.getByRole("button", { name: `${puzzle.centre}, centre letter` }),
    ).toBeInTheDocument();
  });
});
