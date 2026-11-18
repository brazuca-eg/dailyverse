import { useEffect, useRef, useState } from "react";
import type { StateStorage } from "../../core/gameStorage";
import { applyGameResult, type GameStats } from "../../core/streak";
import { DAY_NAMES, TRIPS, WEATHERS } from "./catalogue";
import {
  buildPuzzleId,
  countPeeksLeft,
  createInitialState,
  finishPreview,
  findTripOnDay,
  isStateForRound,
  placeTrip,
  removeTrip,
  spendPeek,
  startPreview,
  submitPlan,
  type WeatherState,
} from "./game";
import { TIER_SETTINGS } from "./tiers";
import type { WeatherRound } from "./types";

const TICK_MS = 1000;
const PEEK_MS = 2000;

export interface WeatherSession {
  state: WeatherState;
  stats: GameStats;
  secondsLeft: number;
  selectedTrip: number | null;
  isPeekArmed: boolean;
  peekedDay: number | null;
  peeksLeft: number;
  notice: string | null;
  start: () => void;
  ready: () => void;
  selectTrip: (trip: number) => void;
  tapDay: (day: number) => void;
  togglePeek: () => void;
  submit: () => void;
}

interface Picking {
  trip: number | null;
  isPeekArmed: boolean;
}

function restoreState(
  storage: StateStorage<WeatherState>,
  round: WeatherRound,
  puzzleId: string,
  dayIndex: number,
): WeatherState {
  const saved = storage.findSavedState(puzzleId, dayIndex);
  if (saved && isStateForRound(saved, round)) {
    return finishPreview(saved);
  }
  return createInitialState(puzzleId, round.puzzle);
}

function describeChange(
  previous: WeatherState,
  next: WeatherState,
  round: WeatherRound,
): string | null {
  if (next.phase === "done") {
    return next.status === "won" ? "Plan submitted. Nice forecasting!" : "Plan submitted.";
  }
  const changed = next.plan.findIndex((day, trip) => day !== previous.plan[trip]);
  if (changed < 0) {
    return null;
  }
  const label = TRIPS[round.puzzle.trips[changed]].label;
  const day = next.plan[changed];
  return day < 0 ? `${label} taken off the plan.` : `${label} planned for ${DAY_NAMES[day].label}.`;
}

export function useWeatherSession(
  storage: StateStorage<WeatherState>,
  round: WeatherRound,
  dayIndex: number,
): WeatherSession {
  const puzzleId = buildPuzzleId(round);
  const settings = TIER_SETTINGS[round.tier];
  const [state, setState] = useState(() => restoreState(storage, round, puzzleId, dayIndex));
  const [stats, setStats] = useState(() => storage.loadStats());
  const [secondsLeft, setSecondsLeft] = useState(settings.previewSeconds);
  const [picking, setPicking] = useState<Picking>({ trip: null, isPeekArmed: false });
  const [peekedDay, setPeekedDay] = useState<number | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const latest = useRef(state);
  const latestStats = useRef(stats);
  const latestPicking = useRef(picking);
  const latestSeconds = useRef(settings.previewSeconds);

  function commit(next: WeatherState) {
    latest.current = next;
    setState(next);
    storage.saveState(dayIndex, next);
  }

  function apply(update: (current: WeatherState) => WeatherState) {
    const previous = latest.current;
    const next = update(previous);
    if (next === previous) {
      return false;
    }
    commit(next);
    setNotice(describeChange(previous, next, round));
    if (previous.status === "playing" && next.status !== "playing") {
      const nextStats = applyGameResult(latestStats.current, dayIndex, next.status === "won");
      latestStats.current = nextStats;
      setStats(nextStats);
      storage.saveStats(nextStats);
    }
    return true;
  }

  function pick(next: Picking) {
    latestPicking.current = next;
    setPicking(next);
  }

  useEffect(() => {
    if (state.phase !== "memorise") {
      return undefined;
    }
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        latestSeconds.current -= 1;
        setSecondsLeft(latestSeconds.current);
        if (latestSeconds.current <= 0) {
          const next = finishPreview(latest.current);
          latest.current = next;
          setState(next);
          storage.saveState(dayIndex, next);
        }
      }
    }, TICK_MS);
    return () => window.clearInterval(timer);
  }, [state.phase, storage, dayIndex]);

  useEffect(() => {
    if (peekedDay === null) {
      return undefined;
    }
    const timer = window.setTimeout(() => setPeekedDay(null), PEEK_MS);
    return () => window.clearTimeout(timer);
  }, [peekedDay]);

  return {
    state,
    stats,
    secondsLeft,
    selectedTrip: picking.trip,
    isPeekArmed: picking.isPeekArmed,
    peekedDay,
    peeksLeft: countPeeksLeft(state, settings.peeks),
    notice,
    start: () => apply(startPreview),
    ready: () => apply(finishPreview),
    selectTrip: (trip) => {
      if (latest.current.phase === "plan") {
        pick({ trip: latestPicking.current.trip === trip ? null : trip, isPeekArmed: false });
      }
    },
    tapDay: (day) => {
      if (latest.current.phase !== "plan") {
        return;
      }
      const { trip, isPeekArmed } = latestPicking.current;
      if (isPeekArmed) {
        if (apply((current) => spendPeek(current, settings.peeks))) {
          setPeekedDay(day);
          setNotice(`${DAY_NAMES[day].label}: ${WEATHERS[round.puzzle.weather[day]].label}.`);
        }
        pick({ trip: null, isPeekArmed: false });
      } else if (trip !== null) {
        apply((current) => placeTrip(current, trip, day));
        pick({ trip: null, isPeekArmed: false });
      } else {
        const planned = findTripOnDay(latest.current, day);
        apply((current) => (planned < 0 ? current : removeTrip(current, planned)));
      }
    },
    togglePeek: () => {
      const canPeek = countPeeksLeft(latest.current, settings.peeks) > 0;
      pick({ trip: null, isPeekArmed: canPeek && !latestPicking.current.isPeekArmed });
    },
    submit: () => apply((current) => submitPlan(current, round.puzzle)),
  };
}
