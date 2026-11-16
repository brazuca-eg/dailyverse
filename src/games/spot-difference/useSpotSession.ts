import { useState } from "react";
import type { StateStorage } from "../../core/gameStorage";
import { applyGameResult, type GameStats } from "../../core/streak";
import {
  applyTap,
  createInitialState,
  buildPuzzleId,
  isStateForPuzzle,
  type MissMark,
  type Point,
  type SpotState,
  type TapOutcome,
} from "./game";
import type { Puzzle } from "./types";

export interface SpotSession {
  state: SpotState;
  stats: GameStats;
  miss: MissMark | null;
  lastOutcome: TapOutcome | null;
  tap: (point: Point, tolerance?: number) => void;
}

function restoreState(
  storage: StateStorage<SpotState>,
  puzzle: Puzzle,
  dayIndex: number,
): SpotState {
  const puzzleId = buildPuzzleId(puzzle);
  const saved = storage.findSavedState(puzzleId, dayIndex);
  return saved && isStateForPuzzle(saved, puzzle) ? saved : createInitialState(puzzleId);
}

export function useSpotSession(
  storage: StateStorage<SpotState>,
  puzzle: Puzzle,
  dayIndex: number,
): SpotSession {
  const [state, setState] = useState(() => restoreState(storage, puzzle, dayIndex));
  const [stats, setStats] = useState(() => storage.loadStats());
  const [miss, setMiss] = useState<MissMark | null>(null);
  const [lastOutcome, setLastOutcome] = useState<TapOutcome | null>(null);

  function tap(point: Point, tolerance?: number) {
    const result = applyTap(state, puzzle, point, tolerance);
    setLastOutcome(result.outcome);
    if (result.outcome === "ignored" || result.outcome === "repeat") {
      return;
    }
    setState(result.state);
    storage.saveState(dayIndex, result.state);
    if (result.outcome === "missed") {
      setMiss({ point, key: result.state.mistakes });
    }
    if (result.state.status !== "playing") {
      const nextStats = applyGameResult(stats, dayIndex, result.state.status === "won");
      setStats(nextStats);
      storage.saveStats(nextStats);
    }
  }

  return { state, stats, miss, lastOutcome, tap };
}
