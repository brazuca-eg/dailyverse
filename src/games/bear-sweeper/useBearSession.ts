import { useEffect, useRef, useState } from "react";
import type { StateStorage } from "../../core/gameStorage";
import { applyGameResult, type GameStats } from "../../core/streak";
import {
  REVEALED,
  addElapsed,
  buildPuzzleId,
  chordCell,
  countEncounters,
  createInitialState,
  giveHint,
  giveUp,
  isStateForPuzzle,
  readLivesLeft,
  revealCell,
  toggleFlag,
  type BearState,
} from "./game";
import type { BearRound } from "./types";

const TICK_MS = 1000;

export interface BearSession {
  state: BearState;
  stats: GameStats;
  isFlagMode: boolean;
  notice: string | null;
  press: (index: number) => void;
  flag: (index: number) => void;
  toggleFlagMode: () => void;
  hint: () => void;
  surrender: () => void;
}

function restoreState(
  storage: StateStorage<BearState>,
  round: BearRound,
  puzzleId: string,
  dayIndex: number,
): BearState {
  const saved = storage.findSavedState(puzzleId, dayIndex);
  return saved && isStateForPuzzle(saved, round.puzzle, puzzleId)
    ? saved
    : createInitialState(puzzleId, round.puzzle);
}

function describeChange(previous: BearState, next: BearState): string | null {
  if (next.status === "won") {
    return "All clear! Every safe square is revealed.";
  }
  if (next.status === "lost") {
    return "The bears win this time.";
  }
  const hit = countEncounters(next) - countEncounters(previous);
  if (hit > 0) {
    const left = readLivesLeft(next);
    return `A bear! ${left} ${left === 1 ? "life" : "lives"} left.`;
  }
  return null;
}

export function useBearSession(
  storage: StateStorage<BearState>,
  round: BearRound,
  dayIndex: number,
): BearSession {
  const puzzleId = buildPuzzleId(round);
  const { puzzle } = round;
  const [state, setState] = useState(() => restoreState(storage, round, puzzleId, dayIndex));
  const [stats, setStats] = useState(() => storage.loadStats());
  const [isFlagMode, setIsFlagMode] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const latest = useRef(state);
  const latestStats = useRef(stats);
  const latestFlagMode = useRef(isFlagMode);

  function apply(update: (current: BearState) => BearState) {
    const previous = latest.current;
    const next = update(previous);
    if (next === previous) {
      return;
    }
    latest.current = next;
    setState(next);
    setNotice(describeChange(previous, next));
    storage.saveState(dayIndex, next);
    if (previous.status === "playing" && next.status !== "playing") {
      const nextStats = applyGameResult(latestStats.current, dayIndex, next.status === "won");
      latestStats.current = nextStats;
      setStats(nextStats);
      storage.saveStats(nextStats);
    }
  }

  useEffect(() => {
    if (state.status !== "playing") {
      return undefined;
    }
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        const next = addElapsed(latest.current, 1);
        latest.current = next;
        setState(next);
        storage.saveState(dayIndex, next);
      }
    }, TICK_MS);
    return () => window.clearInterval(timer);
  }, [state.status, storage, dayIndex]);

  return {
    state,
    stats,
    isFlagMode,
    notice,
    press: (index) =>
      apply((current) => {
        const cell = current.cells[index];
        if (cell === REVEALED) {
          return chordCell(current, puzzle, index);
        }
        if (latestFlagMode.current) {
          return toggleFlag(current, index);
        }
        return revealCell(current, puzzle, index);
      }),
    flag: (index) => apply((current) => toggleFlag(current, index)),
    toggleFlagMode: () => {
      latestFlagMode.current = !latestFlagMode.current;
      setIsFlagMode(latestFlagMode.current);
    },
    hint: () => apply((current) => giveHint(current, puzzle)),
    surrender: () => apply(giveUp),
  };
}
