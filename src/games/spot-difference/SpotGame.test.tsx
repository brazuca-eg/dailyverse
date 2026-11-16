import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { buildDailyPuzzle } from "./daily";
import { findHitDifference } from "./game";
import { SpotGame } from "./SpotGame";
import type { Difference } from "./types";

const LAUNCH_DATE = new Date("2026-11-16T00:00:00Z");
const puzzle = buildDailyPuzzle(0);

type User = ReturnType<typeof userEvent.setup>;

function renderGame() {
  return render(<SpotGame launchDate={LAUNCH_DATE} />);
}

function pictures(): HTMLButtonElement[] {
  return [
    screen.getByRole("button", { name: /^First picture/ }),
    screen.getByRole("button", { name: /^Second picture/ }),
  ] as HTMLButtonElement[];
}

function tapAt(picture: HTMLElement, x: number, y: number) {
  fireEvent.click(picture, { clientX: x, clientY: y, detail: 1 });
}

function tapDifference(difference: Difference, pictureIndex = 0) {
  const { region } = difference;
  tapAt(
    pictures()[pictureIndex],
    (region.left + region.right) / 2,
    (region.top + region.bottom) / 2,
  );
}

function tapNowhere(pictureIndex = 0) {
  tapAt(pictures()[pictureIndex], 2, 2);
}

function findDialog(title: string): HTMLElement {
  const dialog = screen.getByRole("heading", { name: title, hidden: true }).closest("dialog");
  if (!dialog) {
    throw new Error(`No dialog titled ${title}`);
  }
  return dialog;
}

async function dismissHelp(user: User) {
  await user.click(screen.getByRole("button", { name: "Start playing" }));
}

const KEYBOARD_STEP = 24;

function findKeyboardTarget(): { right: number; down: number } | null {
  const offsets = Array.from({ length: 33 }, (_, index) => index - 16);
  const reachable = offsets.flatMap((right) => offsets.map((down) => ({ right, down })));
  return (
    reachable
      .filter(({ right, down }) =>
        findHitDifference(puzzle.differences, {
          x: 400 + right * KEYBOARD_STEP,
          y: 300 + down * KEYBOARD_STEP,
        }),
      )
      .sort(
        (a, b) => Math.abs(a.right) + Math.abs(a.down) - Math.abs(b.right) - Math.abs(b.down),
      )[0] ?? null
  );
}

describe("SpotGame", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-11-16T10:00:00Z"));
    vi.spyOn(Element.prototype, "getBoundingClientRect").mockReturnValue({
      left: 0,
      top: 0,
      width: 800,
      height: 600,
      right: 800,
      bottom: 600,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
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

  it("starts with two pictures, nothing found and three lives", async () => {
    const user = userEvent.setup();
    renderGame();
    await dismissHelp(user);
    expect(pictures()).toHaveLength(2);
    expect(screen.getAllByText("Found 0 of 5").length).toBeGreaterThan(0);
    expect(screen.getByRole("img", { name: "3 lives left" })).toBeInTheDocument();
    expect(screen.getByText("Tap a difference in either picture.")).toBeInTheDocument();
  });

  it("circles a found difference in both pictures without costing a life", async () => {
    const user = userEvent.setup();
    const { container } = renderGame();
    await dismissHelp(user);
    tapDifference(puzzle.differences[0]);
    expect(screen.getAllByText("Found 1 of 5").length).toBeGreaterThan(0);
    expect(container.querySelectorAll(".marker-found")).toHaveLength(2);
    expect(screen.getByRole("img", { name: "3 lives left" })).toBeInTheDocument();
  });

  it("finds a difference by tapping either picture", async () => {
    const user = userEvent.setup();
    renderGame();
    await dismissHelp(user);
    tapDifference(puzzle.differences[0], 0);
    tapDifference(puzzle.differences[1], 1);
    expect(screen.getAllByText("Found 2 of 5").length).toBeGreaterThan(0);
  });

  it("takes a life and shows a mark for a wrong tap", async () => {
    const user = userEvent.setup();
    const { container } = renderGame();
    await dismissHelp(user);
    tapNowhere();
    expect(screen.getByRole("img", { name: "2 lives left" })).toBeInTheDocument();
    expect(container.querySelectorAll(".miss-mark")).toHaveLength(2);
  });

  it("does not take a life for tapping a difference that is already found", async () => {
    const user = userEvent.setup();
    renderGame();
    await dismissHelp(user);
    tapDifference(puzzle.differences[0]);
    tapDifference(puzzle.differences[0], 1);
    expect(screen.getByRole("img", { name: "3 lives left" })).toBeInTheDocument();
    expect(screen.getAllByText("Found 1 of 5").length).toBeGreaterThan(0);
  });

  it("announces each tap for screen readers", async () => {
    const user = userEvent.setup();
    renderGame();
    await dismissHelp(user);
    tapDifference(puzzle.differences[0]);
    expect(screen.getByText("Found a difference. 1 of 5 found.")).toBeInTheDocument();
    tapNowhere();
    expect(
      screen.getByText("No difference there. 2 lives left. 1 of 5 found."),
    ).toBeInTheDocument();
  });

  it("wins when all five are found, with the score and a share text", async () => {
    const user = userEvent.setup();
    renderGame();
    await dismissHelp(user);
    tapNowhere();
    puzzle.differences.forEach((difference) => tapDifference(difference));
    expect(screen.getByRole("heading", { name: "You got it!" })).toBeInTheDocument();
    expect(screen.getByText("You found all 5 differences")).toBeInTheDocument();
    expect(screen.getByText("4 / 5 points")).toBeInTheDocument();
    expect(screen.getByText(/Dailyverse Spot the Difference #1 5\/5/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Share result" })).toBeInTheDocument();
    expect(screen.queryByText("Tap a difference in either picture.")).not.toBeInTheDocument();
  });

  it("loses after three wrong taps and shows where every difference was", async () => {
    const user = userEvent.setup();
    const { container } = renderGame();
    await dismissHelp(user);
    tapDifference(puzzle.differences[0]);
    tapNowhere();
    tapNowhere();
    tapNowhere();
    expect(screen.getByRole("heading", { name: "Not this time" })).toBeInTheDocument();
    expect(screen.getByText("Out of lives")).toBeInTheDocument();
    expect(screen.getByText("You found 1 of 5 differences")).toBeInTheDocument();
    expect(screen.getByText("0 / 5 points")).toBeInTheDocument();
    expect(container.querySelectorAll(".marker-found")).toHaveLength(2);
    expect(container.querySelectorAll(".marker-missed")).toHaveLength(8);
  });

  it("stops taking taps once the round is over", async () => {
    const user = userEvent.setup();
    renderGame();
    await dismissHelp(user);
    puzzle.differences.forEach((difference) => tapDifference(difference));
    tapNowhere();
    expect(screen.getByText("You found all 5 differences")).toBeInTheDocument();
    expect(screen.getByText("5 / 5 points")).toBeInTheDocument();
  });

  it("restores a round in progress after a reload", async () => {
    const user = userEvent.setup();
    const first = renderGame();
    await dismissHelp(user);
    tapDifference(puzzle.differences[2]);
    tapNowhere();
    first.unmount();
    const { container } = renderGame();
    expect(screen.getAllByText("Found 1 of 5").length).toBeGreaterThan(0);
    expect(screen.getByRole("img", { name: "2 lives left" })).toBeInTheDocument();
    expect(container.querySelectorAll(".marker-found")).toHaveLength(2);
  });

  it("restores a finished round after a reload", async () => {
    const user = userEvent.setup();
    const first = renderGame();
    await dismissHelp(user);
    puzzle.differences.forEach((difference) => tapDifference(difference));
    first.unmount();
    renderGame();
    expect(screen.getByRole("heading", { name: "You got it!" })).toBeInTheDocument();
  });

  it("does not interrupt a player who already started with the how-to-play dialog", async () => {
    const user = userEvent.setup();
    const first = renderGame();
    await dismissHelp(user);
    tapNowhere();
    first.unmount();
    localStorage.removeItem("dailyverse:spot-difference:help-seen");
    renderGame();
    expect(findDialog("How to play")).not.toHaveAttribute("open");
  });

  it("records the result in its own stats", async () => {
    const user = userEvent.setup();
    renderGame();
    await dismissHelp(user);
    puzzle.differences.forEach((difference) => tapDifference(difference));
    await user.click(screen.getByRole("button", { name: "Your stats" }));
    const dialog = findDialog("Your stats");
    expect(within(dialog).getByText("Played").nextElementSibling).toHaveTextContent("1");
    expect(within(dialog).getByText("Win rate").nextElementSibling).toHaveTextContent("100%");
    expect(localStorage.getItem("dailyverse:spot-difference:stats")).not.toBeNull();
    expect(localStorage.getItem("dailyverse:mystery-place:stats")).toBeNull();
  });

  it("shows a new puzzle the next day", async () => {
    const user = userEvent.setup();
    const first = renderGame();
    await dismissHelp(user);
    puzzle.differences.forEach((difference) => tapDifference(difference));
    first.unmount();
    vi.setSystemTime(new Date("2026-11-17T10:00:00Z"));
    renderGame();
    expect(screen.queryByRole("heading", { name: "You got it!" })).not.toBeInTheDocument();
    expect(screen.getAllByText("Found 0 of 5").length).toBeGreaterThan(0);
  });

  it("can be played with the keyboard: move the crosshair, then mark", async () => {
    const user = userEvent.setup();
    const { container } = renderGame();
    await dismissHelp(user);
    const [picture] = pictures();
    fireEvent.keyDown(picture, { key: "Enter" });
    expect(container.querySelectorAll(".crosshair")).toHaveLength(2);

    const target = findKeyboardTarget();
    expect(target).not.toBeNull();
    const moves = target as { right: number; down: number };
    const press = (key: string, times: number) =>
      Array.from({ length: times }).forEach(() => fireEvent.keyDown(picture, { key }));
    press(moves.right >= 0 ? "ArrowRight" : "ArrowLeft", Math.abs(moves.right));
    press(moves.down >= 0 ? "ArrowDown" : "ArrowUp", Math.abs(moves.down));
    fireEvent.keyDown(picture, { key: "Enter" });

    expect(screen.getAllByText("Found 1 of 5").length).toBeGreaterThan(0);
    expect(screen.getByRole("img", { name: "3 lives left" })).toBeInTheDocument();
  });

  it("costs a life when the keyboard marks an empty spot", async () => {
    const user = userEvent.setup();
    renderGame();
    await dismissHelp(user);
    const [picture] = pictures();
    fireEvent.keyDown(picture, { key: "ArrowLeft" });
    Array.from({ length: 16 }).forEach(() => fireEvent.keyDown(picture, { key: "ArrowLeft" }));
    fireEvent.keyDown(picture, { key: "Enter" });
    expect(screen.getByRole("img", { name: "2 lives left" })).toBeInTheDocument();
  });

  it("shows the crosshair on both pictures and hides it after a pointer tap", async () => {
    const user = userEvent.setup();
    const { container } = renderGame();
    await dismissHelp(user);
    fireEvent.keyDown(pictures()[1], { key: "ArrowDown" });
    expect(container.querySelectorAll(".crosshair")).toHaveLength(2);
    tapNowhere();
    expect(container.querySelectorAll(".crosshair")).toHaveLength(0);
  });

  it("zooms both pictures in and out with a button that says which it is", async () => {
    const user = userEvent.setup();
    const { container } = renderGame();
    await dismissHelp(user);
    const zoom = screen.getByRole("button", { name: "Zoom in" });
    expect(zoom).toHaveAttribute("aria-pressed", "false");
    await user.click(zoom);
    expect(screen.getByRole("button", { name: "Zoom out" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(container.querySelectorAll(".scene-frame-zoomed")).toHaveLength(2);
    await user.click(screen.getByRole("button", { name: "Zoom out" }));
    expect(container.querySelectorAll(".scene-frame-zoomed")).toHaveLength(0);
  });

  it("scrolls the other picture to the same place, so they stay comparable", async () => {
    const user = userEvent.setup();
    const { container } = renderGame();
    await dismissHelp(user);
    await user.click(screen.getByRole("button", { name: "Zoom in" }));
    const [first, second] = [...container.querySelectorAll<HTMLDivElement>(".scene-frame")];
    [first, second].forEach((frame) =>
      Object.defineProperty(frame, "scrollLeft", { value: 0, writable: true }),
    );
    [first, second].forEach((frame) =>
      Object.defineProperty(frame, "scrollTop", { value: 0, writable: true }),
    );
    first.scrollLeft = 120;
    first.scrollTop = 80;
    fireEvent.scroll(first);
    expect(second.scrollLeft).toBe(120);
    expect(second.scrollTop).toBe(80);
    second.scrollLeft = 30;
    fireEvent.scroll(second);
    expect(first.scrollLeft).toBe(30);
  });

  it("explains the keyboard controls and zoom in the how-to-play dialog", () => {
    renderGame();
    const dialog = findDialog("How to play");
    expect(within(dialog).getByText(/arrow keys/)).toBeInTheDocument();
    expect(within(dialog).getByText(/Zoom in/)).toBeInTheDocument();
  });
});
