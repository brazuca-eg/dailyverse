import { useEffect, useRef, useState } from "react";
import type { StateStorage } from "../../core/gameStorage";
import { applyGameResult, type GameStats } from "../../core/streak";
import {
  addElapsed,
  buildPuzzleId,
  countReachedMarks,
  createInitialState,
  giveHint,
  giveUp,
  isStateForPuzzle,
  moveTo,
  resetPath,
  undoStep,
  type SwitchbackState,
} from "./game";
import { toCol, toRow } from "./grid";
import type { SwitchbackRound } from "./types";

const TICK_MS = 1000;

export type Direction = "up" | "right" | "down" | "left";

export interface SwitchbackSession {
  state: SwitchbackState;
  stats: GameStats;
  notice: string | null;
  move: (cell: number) => void;
  step: (direction: Direction) => void;
  undo: () => void;
  reset: () => void;
  hint: () => void;
  surrender: () => void;
}

function restoreState(
  storage: StateStorage<SwitchbackState>,
  round: SwitchbackRound,
  puzzleId: string,
  dayIndex: number,
): SwitchbackState {
  const saved = storage.findSavedState(puzzleId, dayIndex);
  return saved && isStateForPuzzle(saved, round.puzzle, puzzleId)
    ? saved
    : createInitialState(puzzleId, round.puzzle);
}

function readTarget(size: number, head: number, direction: Direction): number | null {
  const row = toRow(size, head) + (direction === "down" ? 1 : direction === "up" ? -1 : 0);
  const col = toCol(size, head) + (direction === "right" ? 1 : direction === "left" ? -1 : 0);
  return row < 0 || col < 0 || row >= size || col >= size ? null : row * size + col;
}

export function useSwitchbackSession(
  storage: StateStorage<SwitchbackState>,
  round: SwitchbackRound,
  dayIndex: number,
): SwitchbackSession {
  const puzzleId = buildPuzzleId(round);
  const { puzzle, solution } = round;
  const [state, setState] = useState(() => restoreState(storage, round, puzzleId, dayIndex));
  const [stats, setStats] = useState(() => storage.loadStats());
  const [notice, setNotice] = useState<string | null>(null);
  const latest = useRef(state);
  const latestStats = useRef(stats);

  function apply(
    update: (current: SwitchbackState) => SwitchbackState,
    message: string | null = null,
  ) {
    const previous = latest.current;
    const next = update(previous);
    if (next === previous) {
      return;
    }
    latest.current = next;
    setState(next);
    setNotice(message ?? describeProgress(previous, next));
    storage.saveState(dayIndex, next);
    if (previous.status === "playing" && next.status !== "playing") {
      const nextStats = applyGameResult(latestStats.current, dayIndex, next.status === "won");
      latestStats.current = nextStats;
      setStats(nextStats);
      storage.saveStats(nextStats);
    }
  }

  function describeProgress(previous: SwitchbackState, next: SwitchbackState): string | null {
    const before = countReachedMarks(puzzle, previous.path);
    const after = countReachedMarks(puzzle, next.path);
    if (next.status === "won") {
      return "Summit reached! Every square is covered.";
    }
    return after > before ? `Checkpoint ${after} reached.` : null;
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
    notice,
    move: (cell) => apply((current) => moveTo(current, puzzle, cell)),
    step: (direction) => {
      const { path } = latest.current;
      const target = readTarget(puzzle.size, path[path.length - 1], direction);
      if (target !== null) {
        apply((current) => moveTo(current, puzzle, target));
      }
    },
    undo: () => apply((current) => undoStep(current, puzzle)),
    reset: () => apply((current) => resetPath(current, puzzle), "Trail cleared."),
    hint: () =>
      apply((current) => giveHint(current, puzzle, solution), "Your trail was corrected one step."),
    surrender: () => apply(giveUp),
  };
}
