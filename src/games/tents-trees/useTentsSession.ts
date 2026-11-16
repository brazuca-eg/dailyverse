import { useEffect, useRef, useState } from "react";
import type { StateStorage } from "../../core/gameStorage";
import { applyGameResult, type GameStats } from "../../core/streak";
import {
  addElapsed,
  buildPuzzleId,
  check,
  clearBoard,
  createInitialState,
  cycleCell,
  giveHint,
  giveUp,
  isStateForPuzzle,
  paintGrass,
  undo,
  type TentsState,
} from "./game";
import type { TentsRound } from "./types";

const TICK_MS = 1000;

export interface TentsSession {
  state: TentsState;
  stats: GameStats;
  notice: string | null;
  cycle: (index: number) => void;
  paint: (indexes: readonly number[]) => void;
  undoMove: () => void;
  clear: () => void;
  runCheck: () => void;
  hint: () => void;
  surrender: () => void;
}

function describeCheck(wrong: number): string {
  if (wrong === 0) {
    return "Everything so far is right.";
  }
  const subject = wrong === 1 ? "1 mark is" : `${wrong} marks are`;
  return `${subject} wrong. That cost a point.`;
}

function restoreState(
  storage: StateStorage<TentsState>,
  round: TentsRound,
  puzzleId: string,
  dayIndex: number,
): TentsState {
  const saved = storage.findSavedState(puzzleId, dayIndex);
  return saved && isStateForPuzzle(saved, round.puzzle, puzzleId)
    ? saved
    : createInitialState(puzzleId, round.puzzle.size);
}

export function useTentsSession(
  storage: StateStorage<TentsState>,
  round: TentsRound,
  dayIndex: number,
): TentsSession {
  const puzzleId = buildPuzzleId(round.seed, round.tier);
  const { puzzle } = round;
  const [state, setState] = useState(() => restoreState(storage, round, puzzleId, dayIndex));
  const [stats, setStats] = useState(() => storage.loadStats());
  const [notice, setNotice] = useState<string | null>(null);
  const latest = useRef(state);
  const latestStats = useRef(stats);

  function apply(update: (current: TentsState) => TentsState, message: string | null = null) {
    const previous = latest.current;
    const next = update(previous);
    setNotice(message);
    if (next === previous) {
      return;
    }
    latest.current = next;
    setState(next);
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
        const previous = latest.current;
        const next = addElapsed(previous, 1);
        latest.current = next;
        setState(next);
        storage.saveState(dayIndex, next);
      }
    }, TICK_MS);
    return () => window.clearInterval(timer);
  }, [state.status, storage, dayIndex]);

  function runCheck() {
    const result = check(latest.current, puzzle);
    apply(() => result.state, describeCheck(result.wrong));
  }

  return {
    state,
    stats,
    notice,
    cycle: (index) => apply((current) => cycleCell(current, puzzle, index)),
    paint: (indexes) => apply((current) => paintGrass(current, puzzle, indexes)),
    undoMove: () => apply((current) => undo(current, puzzle)),
    clear: () => apply(clearBoard),
    runCheck,
    hint: () => apply((current) => giveHint(current, puzzle)),
    surrender: () => apply(giveUp),
  };
}
