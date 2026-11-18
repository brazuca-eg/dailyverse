import { useEffect, useRef, useState } from "react";
import type { StateStorage } from "../../core/gameStorage";
import { shuffle } from "../../core/random";
import { applyGameResult, type GameStats } from "../../core/streak";
import {
  createInitialState,
  deleteLastLetter,
  describeAcceptance,
  describeRejection,
  endGame,
  readStatus,
  submitGuess,
  typeLetter,
  type TrailState,
} from "./game";
import type { TrailPuzzle } from "./puzzle";

const TOAST_MS = 1600;

export type ToastTone = "good" | "pangram" | "bad";

export interface Toast {
  id: number;
  text: string;
  tone: ToastTone;
}

export interface TrailSession {
  state: TrailState;
  stats: GameStats;
  input: string;
  outer: readonly string[];
  toast: Toast | null;
  type: (key: string) => void;
  backspace: () => void;
  submit: () => void;
  shuffleOuter: () => void;
  finish: () => void;
}

function restoreState(
  storage: StateStorage<TrailState>,
  puzzle: TrailPuzzle,
  dayIndex: number,
): TrailState {
  const saved = storage.findSavedState(puzzle.code, dayIndex);
  if (saved === null) {
    return createInitialState(puzzle.code);
  }
  return { ...saved, found: saved.found.filter((word) => puzzle.words.includes(word)) };
}

export function useTrailSession(
  storage: StateStorage<TrailState>,
  puzzle: TrailPuzzle,
  dayIndex: number,
): TrailSession {
  const [state, setState] = useState(() => restoreState(storage, puzzle, dayIndex));
  const [stats, setStats] = useState(() => storage.loadStats());
  const [input, setInput] = useState("");
  const latestInput = useRef("");
  const [outer, setOuter] = useState(puzzle.outer);
  const [toast, setToast] = useState<Toast | null>(null);
  const latest = useRef(state);
  const latestStats = useRef(stats);
  const toastCount = useRef(0);

  useEffect(() => {
    if (toast === null) {
      return undefined;
    }
    const timer = window.setTimeout(() => setToast(null), TOAST_MS);
    return () => window.clearTimeout(timer);
  }, [toast]);

  function changeInput(next: string) {
    latestInput.current = next;
    setInput(next);
  }

  function showToast(text: string, tone: ToastTone) {
    toastCount.current += 1;
    setToast({ id: toastCount.current, text, tone });
  }

  function commit(next: TrailState) {
    const previous = latest.current;
    latest.current = next;
    setState(next);
    storage.saveState(dayIndex, next);
    const before = readStatus(puzzle, previous);
    const after = readStatus(puzzle, next);
    if (before === "playing" && after !== "playing") {
      const nextStats = applyGameResult(latestStats.current, dayIndex, after === "won");
      latestStats.current = nextStats;
      setStats(nextStats);
      storage.saveStats(nextStats);
    }
  }

  function submit() {
    if (latest.current.ended) {
      return;
    }
    const outcome = submitGuess(puzzle, latest.current, latestInput.current);
    changeInput("");
    if (!outcome.result.accepted) {
      showToast(describeRejection(outcome.result.reason), "bad");
      return;
    }
    showToast(describeAcceptance(outcome.result), outcome.result.isPangram ? "pangram" : "good");
    commit(outcome.state);
  }

  return {
    state,
    stats,
    input,
    outer,
    toast,
    type: (key) => {
      if (!latest.current.ended) {
        changeInput(typeLetter(latestInput.current, key));
      }
    },
    backspace: () => changeInput(deleteLastLetter(latestInput.current)),
    submit,
    shuffleOuter: () => setOuter((current) => shuffle(current, Math.random)),
    finish: () => {
      if (!latest.current.ended) {
        commit(endGame(latest.current));
      }
    },
  };
}
