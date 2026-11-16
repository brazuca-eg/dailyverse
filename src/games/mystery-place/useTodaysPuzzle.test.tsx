import { renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { countries } from "../../core/countries";
import { puzzles } from "./data";
import { useTodaysPuzzle } from "./useTodaysPuzzle";

const LAUNCH_DATE = new Date("2026-11-15T00:00:00Z");

function renderToday(launchDate = LAUNCH_DATE, countryList = countries) {
  return renderHook(
    (props: { launchDate: Date }) => useTodaysPuzzle(puzzles, countryList, props.launchDate),
    { initialProps: { launchDate } },
  );
}

describe("useTodaysPuzzle", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("picks the puzzle for the number of days since launch", () => {
    vi.setSystemTime(new Date("2026-11-16T10:00:00Z"));
    const { result } = renderToday();
    expect(result.current.dayIndex).toBe(1);
    expect(result.current.puzzle).toBe(puzzles[1]);
    expect(result.current.answer?.code).toBe(puzzles[1].country);
  });

  it("starts with the first puzzle on launch day", () => {
    vi.setSystemTime(new Date("2026-11-15T00:00:00Z"));
    const { result } = renderToday();
    expect(result.current.dayIndex).toBe(0);
    expect(result.current.puzzle).toBe(puzzles[0]);
  });

  it("starts over after the last puzzle", () => {
    vi.setSystemTime(new Date("2026-11-16T10:00:00Z"));
    const launchedLongAgo = new Date(LAUNCH_DATE.getTime() - puzzles.length * 86_400_000);
    const { result } = renderToday(launchedLongAgo);
    expect(result.current.dayIndex).toBe(puzzles.length + 1);
    expect(result.current.puzzle).toBe(puzzles[1]);
  });

  it("keeps the same puzzle on screen when the clock passes midnight during a session", () => {
    vi.setSystemTime(new Date("2026-11-16T23:59:59Z"));
    const { result, rerender } = renderToday();
    const before = result.current;

    vi.setSystemTime(new Date("2026-11-17T00:00:05Z"));
    rerender({ launchDate: LAUNCH_DATE });

    expect(result.current.dayIndex).toBe(before.dayIndex);
    expect(result.current.puzzle).toBe(before.puzzle);
  });

  it("reports no answer when the puzzle's country is missing from the list", () => {
    vi.setSystemTime(new Date("2026-11-16T10:00:00Z"));
    const withoutAnswer = countries.filter((country) => country.code !== puzzles[1].country);
    const { result } = renderToday(LAUNCH_DATE, withoutAnswer);
    expect(result.current.answer).toBeNull();
  });
});
