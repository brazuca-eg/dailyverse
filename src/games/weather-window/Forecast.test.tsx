import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { mediumRound } from "./fixtures";
import { Forecast } from "./Forecast";
import { UNPLACED } from "./types";

const { puzzle } = mediumRound;
const noPlan = [UNPLACED, UNPLACED, UNPLACED];

function renderForecast(overrides: Partial<Parameters<typeof Forecast>[0]> = {}) {
  const onTapDay = vi.fn();
  render(
    <Forecast
      puzzle={puzzle}
      plan={noPlan}
      isRevealed={() => false}
      isActive
      selectedTrip={null}
      isPeekArmed={false}
      onTapDay={onTapDay}
      {...overrides}
    />,
  );
  return onTapDay;
}

describe("Forecast", () => {
  it("shows a button for every day with its weather hidden", () => {
    renderForecast();
    expect(screen.getAllByRole("button")).toHaveLength(puzzle.weather.length);
    expect(
      screen.getByRole("button", { name: "Monday, weather hidden, no trip planned" }),
    ).toBeVisible();
    expect(screen.getAllByText("Hidden")).toHaveLength(puzzle.weather.length);
  });

  it("names the weather of the days that are shown", () => {
    renderForecast({ isRevealed: (day) => day === 1 });
    const label = ["Sunny", "Cloudy", "Rainy", "Windy", "Snowy"][puzzle.weather[1]];
    expect(
      screen.getByRole("button", { name: `Tuesday, ${label}, no trip planned` }),
    ).toBeVisible();
    expect(screen.getAllByText("Hidden")).toHaveLength(puzzle.weather.length - 1);
  });

  it("names the trip planned on a day", () => {
    renderForecast({ plan: [UNPLACED, 3, UNPLACED] });
    expect(
      screen.getByRole("button", { name: /^Thursday, weather hidden, \w+ planned$/ }),
    ).toBeVisible();
  });

  it("reports the day that was tapped", () => {
    const onTapDay = renderForecast();
    fireEvent.click(screen.getByRole("button", { name: /^Wednesday/ }));
    expect(onTapDay).toHaveBeenCalledWith(2);
  });

  it("cannot be tapped when it is not active", () => {
    renderForecast({ isActive: false });
    screen.getAllByRole("button").forEach((button) => expect(button).toBeDisabled());
  });

  it("marks the days as targets while a trip or a peek is chosen", () => {
    renderForecast({ selectedTrip: 0 });
    screen.getAllByRole("button").forEach((button) => {
      expect(button).toHaveAttribute("data-targeted", "true");
    });
  });

  it("does not mark targets when nothing is chosen", () => {
    renderForecast();
    screen.getAllByRole("button").forEach((button) => {
      expect(button).toHaveAttribute("data-targeted", "false");
    });
  });
});
