import { hasStartedPlaying } from "../../core/clock";
import { useEffect, useRef, useState, useMemo } from "react";
import type { StateStorage } from "../../core/gameStorage";
import { applyGameResult, type GameStats } from "../../core/streak";
import {
  addElapsed,
  buildPuzzleId,
  checkBoard,
  createInitialState,
  enterDigit,
  eraseCell,
  giveHint,
  giveUp,
  isStateForPuzzle,
  toggleNote,
  undoMove,
  type SudokuState,
  calculateScore,
} from "./game";
import { sudokuMessages as t } from "./messages";
import type { SudokuRound } from "./types";

const TICK_MS = 1000;

export interface SudokuSession {
  state: SudokuState;
  stats: GameStats;
  selected: number | null;
  isNotesMode: boolean;
  notice: string | null;
  select: (index: number) => void;
  enter: (digit: number) => void;
  erase: () => void;
  undo: () => void;
  toggleNotesMode: () => void;
  runCheck: () => void;
  hint: () => void;
  surrender: () => void;
}

function describeCheck(wrong: number): string {
  if (wrong === 0) {
    return t("sudoku.notice.allRight");
  }
  return t("sudoku.notice.wrong", { count: wrong });
}

function restoreState(
  storage: StateStorage<SudokuState>,
  round: SudokuRound,
  puzzleId: string,
  dayIndex: number,
): SudokuState {
  const saved = storage.findSavedState(puzzleId, dayIndex);
  return saved && isStateForPuzzle(saved, round.puzzle, puzzleId)
    ? saved
    : createInitialState(puzzleId, round.puzzle.size);
}

function findFirstOpenCell(round: SudokuRound, state: SudokuState): number | null {
  const index = round.puzzle.givens.findIndex(
    (given, position) => given === 0 && state.entries[position] === 0,
  );
  return index === -1 ? null : index;
}

export function useSudokuSession(
  storage: StateStorage<SudokuState>,
  round: SudokuRound,
  dayIndex: number,
): SudokuSession {
  const puzzleId = buildPuzzleId(round);
  const { puzzle } = round;
  const [state, setState] = useState(() => restoreState(storage, round, puzzleId, dayIndex));
  const [stats, setStats] = useState(() => storage.loadStats());
  const [selected, setSelected] = useState<number | null>(() => findFirstOpenCell(round, state));
  const [isNotesMode, setIsNotesMode] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const latest = useRef(state);
  const latestSelected = useRef(selected);
  const latestNotesMode = useRef(isNotesMode);
  const latestStats = useRef(stats);

  function apply(update: (current: SudokuState) => SudokuState, message: string | null = null) {
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
      storage.recordResult(calculateScore(next), next.status === "won");
    }
  }

  const initialState = useMemo(
    () => createInitialState(puzzleId, round.puzzle.size),
    [puzzleId, round],
  );
  const isClockRunning = state.status === "playing" && hasStartedPlaying(state, initialState);

  useEffect(() => {
    if (!isClockRunning) {
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
  }, [isClockRunning, storage, dayIndex]);

  function runCheck() {
    const result = checkBoard(latest.current, puzzle);
    apply(() => result.state, describeCheck(result.wrong));
  }

  return {
    state,
    stats,
    selected,
    isNotesMode,
    notice,
    select: (index) => {
      latestSelected.current = index;
      setSelected(index);
    },
    enter: (digit) => {
      const target = latestSelected.current;
      if (target === null) {
        setNotice(t("sudoku.notice.select"));
        return;
      }
      apply((current) =>
        latestNotesMode.current
          ? toggleNote(current, puzzle, target, digit)
          : enterDigit(current, puzzle, target, digit),
      );
    },
    erase: () => {
      const target = latestSelected.current;
      if (target !== null) {
        apply((current) => eraseCell(current, puzzle, target));
      }
    },
    undo: () => apply((current) => undoMove(current, puzzle)),
    toggleNotesMode: () => {
      latestNotesMode.current = !latestNotesMode.current;
      setIsNotesMode(latestNotesMode.current);
    },
    runCheck,
    hint: () => apply((current) => giveHint(current, puzzle, latestSelected.current)),
    surrender: () => apply(giveUp),
  };
}
