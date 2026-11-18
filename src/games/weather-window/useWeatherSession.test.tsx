import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createInitialState, buildPuzzleId, finishPreview, placeTrip, startPreview } from "./game";
import { easyRound } from "./fixtures";
import { weatherWindowStorage } from "./persistence";
import { analysePuzzle, scorePlan } from "./solver";
import { TIER_SETTINGS } from "./tiers";
import { UNPLACED } from "./types";
import { useWeatherSession } from "./useWeatherSession";

const { puzzle } = easyRound;
const puzzleId = buildPuzzleId(easyRound);
const settings = TIER_SETTINGS.easy;
const { bestPlan } = analysePuzzle(puzzle);
const DAY = 0;

function renderSession(day = DAY) {
  return renderHook(() => useWeatherSession(weatherWindowStorage, easyRound, day));
}

type Session = ReturnType<typeof renderSession>;

function run(session: Session, action: (current: Session["result"]["current"]) => void) {
  act(() => action(session.result.current));
}

function toPlanning(session: Session) {
  run(session, (current) => current.start());
  run(session, (current) => current.ready());
}

function placeAll(session: Session, plan: number[]) {
  plan.forEach((day, trip) => {
    run(session, (current) => current.selectTrip(trip));
    run(session, (current) => current.tapDay(day));
  });
}

function tick(seconds: number) {
  act(() => {
    vi.advanceTimersByTime(seconds * 1000);
  });
}

function saveInProgress(plan: number[], phase: "memorise" | "plan") {
  const ready = finishPreview(startPreview(createInitialState(puzzleId, puzzle)));
  const placed = plan.reduce((state, day, trip) => placeTrip(state, trip, day), ready);
  weatherWindowStorage.saveState(DAY, {
    ...placed,
    phase,
    plan: phase === "memorise" ? [UNPLACED, UNPLACED] : plan,
  });
}

describe("useWeatherSession", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("starts at the intro with nothing chosen and no message", () => {
    const session = renderSession();
    const current = session.result.current;
    expect(current.state.phase).toBe("intro");
    expect(current.secondsLeft).toBe(settings.previewSeconds);
    expect(current.selectedTrip).toBeNull();
    expect(current.isPeekArmed).toBe(false);
    expect(current.peekedDay).toBeNull();
    expect(current.peeksLeft).toBe(settings.peeks);
    expect(current.notice).toBeNull();
  });

  it("counts the preview down every second and then moves on to planning", () => {
    const session = renderSession();
    run(session, (current) => current.start());
    expect(session.result.current.state.phase).toBe("memorise");
    tick(3);
    expect(session.result.current.secondsLeft).toBe(settings.previewSeconds - 3);
    tick(settings.previewSeconds - 4);
    expect(session.result.current.state.phase).toBe("memorise");
    tick(1);
    expect(session.result.current.state.phase).toBe("plan");
    expect(session.result.current.secondsLeft).toBe(0);
  });

  it("does not count down while the page is hidden", () => {
    const session = renderSession();
    run(session, (current) => current.start());
    vi.spyOn(document, "visibilityState", "get").mockReturnValue("hidden");
    tick(settings.previewSeconds + 5);
    expect(session.result.current.state.phase).toBe("memorise");
    expect(session.result.current.secondsLeft).toBe(settings.previewSeconds);
  });

  it("ends the preview early when the player is ready", () => {
    const session = renderSession();
    run(session, (current) => current.start());
    run(session, (current) => current.ready());
    expect(session.result.current.state.phase).toBe("plan");
  });

  it("shows the preview only once, even after a reload", () => {
    const first = renderSession();
    run(first, (current) => current.start());
    first.unmount();
    const second = renderSession();
    expect(second.result.current.state.phase).toBe("plan");
    expect(second.result.current.state.plan).toEqual([UNPLACED, UNPLACED]);
  });

  it("keeps a plan in progress after a reload", () => {
    const first = renderSession();
    toPlanning(first);
    placeAll(first, [2, 3]);
    first.unmount();
    expect(renderSession().result.current.state.plan).toEqual([2, 3]);
  });

  it("starts again from the intro when the saved game is for another day or is invalid", () => {
    saveInProgress([2, 3], "plan");
    expect(renderSession(1).result.current.state.phase).toBe("intro");
    window.localStorage.setItem(
      weatherWindowStorage.keys.game,
      JSON.stringify({
        dayIndex: DAY,
        state: { puzzleId, phase: "plan", plan: [9, 9], peeksUsed: 0, status: "playing" },
      }),
    );
    expect(renderSession().result.current.state.phase).toBe("intro");
  });

  it("selects a trip and puts it down again when it is tapped twice", () => {
    const session = renderSession();
    toPlanning(session);
    run(session, (current) => current.selectTrip(1));
    expect(session.result.current.selectedTrip).toBe(1);
    run(session, (current) => current.selectTrip(1));
    expect(session.result.current.selectedTrip).toBeNull();
  });

  it("ignores taps before planning has begun", () => {
    const session = renderSession();
    run(session, (current) => current.selectTrip(0));
    run(session, (current) => current.tapDay(1));
    expect(session.result.current.selectedTrip).toBeNull();
    expect(session.result.current.state.plan).toEqual([UNPLACED, UNPLACED]);
  });

  it("plans the selected trip on the tapped day and says so", () => {
    const session = renderSession();
    toPlanning(session);
    run(session, (current) => current.selectTrip(0));
    run(session, (current) => current.tapDay(3));
    expect(session.result.current.state.plan[0]).toBe(3);
    expect(session.result.current.selectedTrip).toBeNull();
    expect(session.result.current.notice).toMatch(/planned for Thursday/);
  });

  it("takes a trip off when its day is tapped with nothing selected", () => {
    const session = renderSession();
    toPlanning(session);
    placeAll(session, [3, 1]);
    run(session, (current) => current.tapDay(3));
    expect(session.result.current.state.plan).toEqual([UNPLACED, 1]);
    expect(session.result.current.notice).toMatch(/taken off the plan/);
  });

  it("does nothing when an empty day is tapped with nothing selected", () => {
    const session = renderSession();
    toPlanning(session);
    run(session, (current) => current.tapDay(4));
    expect(session.result.current.state.plan).toEqual([UNPLACED, UNPLACED]);
    expect(session.result.current.notice).toBeNull();
  });

  it("peeks at a day: spends a peek, shows the day for two seconds and says its weather", () => {
    const session = renderSession();
    toPlanning(session);
    run(session, (current) => current.togglePeek());
    expect(session.result.current.isPeekArmed).toBe(true);
    run(session, (current) => current.tapDay(2));
    expect(session.result.current.peekedDay).toBe(2);
    expect(session.result.current.peeksLeft).toBe(settings.peeks - 1);
    expect(session.result.current.isPeekArmed).toBe(false);
    expect(session.result.current.notice).toMatch(/^Wednesday: /);
    tick(1);
    expect(session.result.current.peekedDay).toBe(2);
    tick(1);
    expect(session.result.current.peekedDay).toBeNull();
  });

  it("does not arm a peek when none are left", () => {
    const session = renderSession();
    toPlanning(session);
    Array.from({ length: settings.peeks }).forEach(() => {
      run(session, (current) => current.togglePeek());
      run(session, (current) => current.tapDay(0));
    });
    run(session, (current) => current.togglePeek());
    expect(session.result.current.isPeekArmed).toBe(false);
    expect(session.result.current.peeksLeft).toBe(0);
  });

  it("puts a peek away when it is tapped again, and when a trip is chosen instead", () => {
    const session = renderSession();
    toPlanning(session);
    run(session, (current) => current.togglePeek());
    run(session, (current) => current.togglePeek());
    expect(session.result.current.isPeekArmed).toBe(false);
    run(session, (current) => current.togglePeek());
    run(session, (current) => current.selectTrip(0));
    expect(session.result.current.isPeekArmed).toBe(false);
    expect(session.result.current.selectedTrip).toBe(0);
    run(session, (current) => current.togglePeek());
    expect(session.result.current.selectedTrip).toBeNull();
    expect(session.result.current.isPeekArmed).toBe(true);
  });

  it("does not plan a trip when a peek was armed", () => {
    const session = renderSession();
    toPlanning(session);
    run(session, (current) => current.selectTrip(0));
    run(session, (current) => current.togglePeek());
    run(session, (current) => current.tapDay(1));
    expect(session.result.current.state.plan).toEqual([UNPLACED, UNPLACED]);
  });

  it("will not submit an unfinished plan", () => {
    const session = renderSession();
    toPlanning(session);
    placeAll(session, [bestPlan[0]]);
    run(session, (current) => current.submit());
    expect(session.result.current.state.phase).toBe("plan");
  });

  it("submits a finished plan once, records a win and says so", () => {
    const session = renderSession();
    toPlanning(session);
    placeAll(session, bestPlan);
    run(session, (current) => current.submit());
    expect(session.result.current.state.status).toBe("won");
    expect(session.result.current.state.phase).toBe("done");
    expect(session.result.current.stats.gamesPlayed).toBe(1);
    expect(session.result.current.stats.gamesWon).toBe(1);
    expect(session.result.current.notice).toMatch(/Plan submitted/);
    run(session, (current) => current.submit());
    expect(session.result.current.stats.gamesPlayed).toBe(1);
  });

  it("records a loss when the plan is poor", () => {
    const session = renderSession();
    toPlanning(session);
    const days = puzzle.weather.map((_, day) => day);
    const worst = days
      .flatMap((first) => days.map((second) => [first, second]))
      .filter(([first, second]) => first !== second)
      .reduce((poor, plan) => (scorePlan(puzzle, plan) < scorePlan(puzzle, poor) ? plan : poor));
    placeAll(session, worst);
    run(session, (current) => current.submit());
    expect(session.result.current.state.status).toBe("lost");
    expect(session.result.current.stats.gamesWon).toBe(0);
    expect(session.result.current.stats.gamesPlayed).toBe(1);
  });

  it("saves the finished game and restores it", () => {
    const first = renderSession();
    toPlanning(first);
    placeAll(first, bestPlan);
    run(first, (current) => current.submit());
    first.unmount();
    const second = renderSession();
    expect(second.result.current.state.phase).toBe("done");
    expect(second.result.current.state.status).toBe("won");
  });

  it("uses the latest choice when two taps arrive before the page redraws", () => {
    const session = renderSession();
    toPlanning(session);
    act(() => {
      session.result.current.selectTrip(1);
      session.result.current.tapDay(4);
    });
    expect(session.result.current.state.plan).toEqual([UNPLACED, 4]);
  });
});
