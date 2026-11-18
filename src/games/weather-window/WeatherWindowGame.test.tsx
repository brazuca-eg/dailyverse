import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { buildDailyWeatherRound } from "./daily";
import { WeatherWindowGame } from "./WeatherWindowGame";
import { analysePuzzle, scorePlan } from "./solver";
import { DAY_NAMES, TRIPS } from "./catalogue";
import { TIER_SETTINGS } from "./tiers";

const round = buildDailyWeatherRound(0);
const { puzzle } = round;
const settings = TIER_SETTINGS[round.tier];
const { bestPlan } = analysePuzzle(puzzle);

function findDialog(title: string): HTMLElement {
  const dialog = screen.getByRole("heading", { name: title, hidden: true }).closest("dialog");
  if (!dialog) {
    throw new Error(`No dialog titled ${title}`);
  }
  return dialog;
}

function startGame() {
  const view = render(<WeatherWindowGame />);
  fireEvent.click(screen.getByRole("button", { name: "Start playing" }));
  return view;
}

function toPlanning() {
  fireEvent.click(screen.getByRole("button", { name: "Show the forecast" }));
  fireEvent.click(screen.getByRole("button", { name: "I'm ready" }));
}

function day(index: number): HTMLElement {
  return screen.getByRole("button", { name: new RegExp(`^${DAY_NAMES[index].label}`) });
}

function trip(index: number): HTMLElement {
  return screen.getByRole("button", { name: new RegExp(`^${TRIPS[puzzle.trips[index]].label}`) });
}

function plan(days: number[]) {
  days.forEach((target, index) => {
    fireEvent.click(trip(index));
    fireEvent.click(day(target));
  });
}

describe("WeatherWindowGame", () => {
  beforeEach(() => {
    vi.useFakeTimers({
      toFake: ["Date", "setInterval", "clearInterval", "setTimeout", "clearTimeout"],
    });
    vi.setSystemTime(new Date("2026-11-19T10:00:00Z"));
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows how to play on the first visit only", () => {
    const first = render(<WeatherWindowGame />);
    expect(findDialog("How to play")).toHaveAttribute("open");
    fireEvent.click(screen.getByRole("button", { name: "Start playing" }));
    expect(findDialog("How to play")).not.toHaveAttribute("open");
    first.unmount();
    render(<WeatherWindowGame />);
    expect(findDialog("How to play")).not.toHaveAttribute("open");
  });

  it("waits at the intro, with every day hidden and the fit guide visible", () => {
    startGame();
    expect(screen.getByText("Ready?")).toBeVisible();
    expect(screen.getAllByText("Hidden")).toHaveLength(settings.days);
    expect(screen.getByRole("table")).toBeVisible();
    expect(screen.queryByRole("button", { name: "Submit plan" })).toBeNull();
  });

  it("shows the whole forecast during the preview and counts down", () => {
    startGame();
    fireEvent.click(screen.getByRole("button", { name: "Show the forecast" }));
    expect(screen.getByText(`Memorise: ${settings.previewSeconds}s`)).toBeVisible();
    expect(screen.queryAllByText("Hidden")).toHaveLength(0);
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(screen.getByText(`Memorise: ${settings.previewSeconds - 2}s`)).toBeVisible();
  });

  it("hides the forecast again when planning starts", () => {
    startGame();
    toPlanning();
    expect(screen.getByText("Plan your trips")).toBeVisible();
    expect(screen.getAllByText("Hidden")).toHaveLength(settings.days);
    expect(screen.getByRole("button", { name: "Submit plan" })).toBeDisabled();
  });

  it("plans trips on days, shows them on the cards, and can take one back", () => {
    startGame();
    toPlanning();
    fireEvent.click(trip(0));
    expect(trip(0)).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(day(2));
    expect(
      screen.getByRole("button", { name: /^Wednesday, weather hidden, \w+ planned$/ }),
    ).toBeVisible();
    expect(screen.getByRole("status")).toHaveTextContent("planned for Wednesday");
    fireEvent.click(day(2));
    expect(
      screen.getByRole("button", { name: /^Wednesday, weather hidden, no trip planned$/ }),
    ).toBeVisible();
  });

  it("enables submitting only when every trip is planned", () => {
    startGame();
    toPlanning();
    plan([bestPlan[0]]);
    expect(screen.getByRole("button", { name: "Submit plan" })).toBeDisabled();
    plan(bestPlan);
    expect(screen.getByRole("button", { name: "Submit plan" })).toBeEnabled();
  });

  it("peeks at one day for two seconds and then hides it again", () => {
    startGame();
    toPlanning();
    fireEvent.click(screen.getByRole("button", { name: `Peek (${settings.peeks} left)` }));
    fireEvent.click(day(1));
    expect(screen.getAllByText("Hidden")).toHaveLength(settings.days - 1);
    expect(screen.getByRole("button", { name: `Peek (${settings.peeks - 1} left)` })).toBeVisible();
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(screen.getAllByText("Hidden")).toHaveLength(settings.days);
  });

  it("reveals the forecast and the score after submitting the best plan", () => {
    startGame();
    toPlanning();
    plan(bestPlan);
    fireEvent.click(screen.getByRole("button", { name: "Submit plan" }));
    const best = analysePuzzle(puzzle).best;
    expect(screen.getByRole("heading", { name: "You got it!" })).toBeVisible();
    expect(screen.getAllByText(`${best} of ${best} points`).length).toBeGreaterThan(0);
    expect(screen.queryAllByText("Hidden")).toHaveLength(0);
    expect(screen.queryByRole("button", { name: "Submit plan" })).toBeNull();
    expect(screen.getByText(/5 \/ 5 points/)).toBeVisible();
    expect(screen.getByText(/Dailyverse Weather Window #1/)).toBeVisible();
  });

  it("shows how the plan compares with the best one", () => {
    startGame();
    toPlanning();
    plan(bestPlan);
    fireEvent.click(screen.getByRole("button", { name: "Submit plan" }));
    const review = screen.getByRole("region", { name: "Your plan and the best plan" });
    expect(within(review).getAllByRole("listitem")).toHaveLength(settings.trips);
  });

  it("shows a poor plan as a loss with the points scored", () => {
    startGame();
    toPlanning();
    const days = puzzle.weather.map((_, index) => index);
    const worst = days
      .flatMap((first) => days.map((second) => [first, second]))
      .filter(([first, second]) => first !== second)
      .reduce((poor, option) =>
        scorePlan(puzzle, option) < scorePlan(puzzle, poor) ? option : poor,
      );
    plan(worst);
    fireEvent.click(screen.getByRole("button", { name: "Submit plan" }));
    expect(screen.getByRole("heading", { name: "Not this time" })).toBeVisible();
    expect(screen.getByText("Washed out")).toBeVisible();
  });

  it("keeps the finished game after a reload", () => {
    const first = startGame();
    toPlanning();
    plan(bestPlan);
    fireEvent.click(screen.getByRole("button", { name: "Submit plan" }));
    first.unmount();
    render(<WeatherWindowGame />);
    expect(screen.getByRole("heading", { name: "You got it!" })).toBeVisible();
  });

  it("does not show the preview again after a reload during it", () => {
    const first = startGame();
    fireEvent.click(screen.getByRole("button", { name: "Show the forecast" }));
    first.unmount();
    render(<WeatherWindowGame />);
    expect(screen.getByText("Plan your trips")).toBeVisible();
    expect(screen.getAllByText("Hidden")).toHaveLength(settings.days);
  });

  it("records the result in the stats dialog", () => {
    startGame();
    toPlanning();
    plan(bestPlan);
    fireEvent.click(screen.getByRole("button", { name: "Submit plan" }));
    fireEvent.click(screen.getByRole("button", { name: "Your stats" }));
    const dialog = findDialog("Your stats");
    expect(dialog).toHaveAttribute("open");
    expect(within(dialog).getByText("Played").nextElementSibling).toHaveTextContent("1");
    expect(within(dialog).getByText("Win rate").nextElementSibling).toHaveTextContent("100%");
  });

  it("reopens the help from the toolbar", () => {
    startGame();
    fireEvent.click(screen.getByRole("button", { name: "How to play" }));
    expect(findDialog("How to play")).toHaveAttribute("open");
  });
});
