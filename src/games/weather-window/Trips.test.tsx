import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { mediumRound } from "./fixtures";
import { Trips } from "./Trips";
import { UNPLACED } from "./types";

const { puzzle } = mediumRound;

function renderTrips(plan: number[], selectedTrip: number | null = null, isActive = true) {
  const onSelect = vi.fn();
  render(
    <Trips
      puzzle={puzzle}
      plan={plan}
      selectedTrip={selectedTrip}
      isActive={isActive}
      onSelect={onSelect}
    />,
  );
  return onSelect;
}

describe("Trips", () => {
  it("shows every trip with its day, or that it is not planned", () => {
    renderTrips([UNPLACED, 4, UNPLACED]);
    expect(screen.getAllByRole("button")).toHaveLength(3);
    expect(screen.getAllByText("Not planned")).toHaveLength(2);
    expect(screen.getByText("Fri")).toBeVisible();
  });

  it("marks only the selected trip as pressed", () => {
    renderTrips([UNPLACED, UNPLACED, UNPLACED], 1);
    const pressed = screen
      .getAllByRole("button")
      .map((button) => button.getAttribute("aria-pressed"));
    expect(pressed).toEqual(["false", "true", "false"]);
  });

  it("reports the index of the trip that was tapped", () => {
    const onSelect = renderTrips([UNPLACED, UNPLACED, UNPLACED]);
    fireEvent.click(screen.getAllByRole("button")[2]);
    expect(onSelect).toHaveBeenCalledWith(2);
  });

  it("cannot be tapped when it is not active", () => {
    renderTrips([0, 1, 2], null, false);
    screen.getAllByRole("button").forEach((button) => expect(button).toBeDisabled());
  });
});
