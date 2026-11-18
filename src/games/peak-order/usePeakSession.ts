import { useRef, useState } from "react";
import type { StateStorage } from "../../core/gameStorage";
import { applyGameResult, type GameStats } from "../../core/streak";
import {
  applyCheck,
  applyMove,
  canCheck,
  createInitialState,
  readCheckRows,
  readStatus,
  type PeakState,
} from "./game";
import type { PeakPuzzle } from "./puzzle";
import { ROUND_SIZE } from "./tiers";

export type FocusTarget = "row" | "up" | "down";

export interface FocusRequest {
  item: number;
  target: FocusTarget;
  id: number;
}

export interface PeakSession {
  state: PeakState;
  stats: GameStats;
  selected: number | null;
  focusRequest: FocusRequest | null;
  notice: string | null;
  pressRow: (position: number) => void;
  shift: (position: number, delta: -1 | 1, target: FocusTarget) => void;
  drop: (from: number, to: number) => void;
  deselect: () => void;
  check: () => void;
}

function describeCheck(state: PeakState): string {
  const rows = readCheckRows(state);
  const right = rows[rows.length - 1].filter(Boolean).length;
  if (right === ROUND_SIZE) {
    return "Every item is in the right place.";
  }
  return right === 0
    ? "None of them are in the right place yet."
    : `${right} of ${ROUND_SIZE} in the right place.`;
}

export function usePeakSession(
  storage: StateStorage<PeakState>,
  puzzle: PeakPuzzle,
  dayIndex: number,
): PeakSession {
  const [state, setState] = useState(
    () => storage.findSavedState(puzzle.id, dayIndex) ?? createInitialState(puzzle),
  );
  const [stats, setStats] = useState(() => storage.loadStats());
  const [selected, setSelected] = useState<number | null>(null);
  const [focusRequest, setFocusRequest] = useState<FocusRequest | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const latest = useRef(state);
  const latestStats = useRef(stats);
  const focusCount = useRef(0);

  function nameAt(order: readonly number[], position: number): string {
    return puzzle.items[order[position]].name;
  }

  function commit(next: PeakState) {
    const previous = latest.current;
    latest.current = next;
    setState(next);
    storage.saveState(dayIndex, next);
    if (readStatus(previous) === "playing" && readStatus(next) !== "playing") {
      const nextStats = applyGameResult(latestStats.current, dayIndex, readStatus(next) === "won");
      latestStats.current = nextStats;
      setStats(nextStats);
      storage.saveStats(nextStats);
    }
  }

  function move(from: number, to: number): PeakState | null {
    const current = latest.current;
    if (readStatus(current) !== "playing" || from === to) {
      return null;
    }
    const next = applyMove(current, from, to);
    commit(next);
    setNotice(`${nameAt(next.order, to)} moved to position ${to + 1} of ${ROUND_SIZE}.`);
    return next;
  }

  function pressRow(position: number) {
    const current = latest.current;
    if (readStatus(current) !== "playing") {
      return;
    }
    if (selected === null) {
      setSelected(position);
      setNotice(
        `${nameAt(current.order, position)} selected. Tap the place it belongs, or use the arrow keys.`,
      );
    } else if (selected === position) {
      setSelected(null);
      setNotice("Selection cleared.");
    } else {
      move(selected, position);
      setSelected(null);
      setFocusRequest(null);
    }
  }

  function shift(position: number, delta: -1 | 1, target: FocusTarget) {
    const to = position + delta;
    const next = move(position, to < 0 || to >= ROUND_SIZE ? position : to);
    if (next !== null) {
      focusCount.current += 1;
      setFocusRequest({ item: next.order[to], target, id: focusCount.current });
      setSelected((current) => (current === position ? to : current));
    }
  }

  function drop(from: number, to: number) {
    move(from, to);
    setSelected(null);
    setFocusRequest(null);
  }

  function check() {
    const current = latest.current;
    if (!canCheck(current)) {
      return;
    }
    const next = applyCheck(current);
    commit(next);
    setSelected(null);
    setNotice(describeCheck(next));
  }

  return {
    state,
    stats,
    selected,
    focusRequest,
    notice,
    pressRow,
    shift,
    drop,
    deselect: () => setSelected(null),
    check,
  };
}
