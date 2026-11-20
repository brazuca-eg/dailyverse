import { useState } from "react";
import type { GameStorage } from "../core/gameStorage";
import {
  applyGuess,
  createGuessingState,
  type GuessingState,
  calculateScore,
} from "../core/guessing";
import { applyGameResult, type GameStats } from "../core/streak";
import type { Country } from "../core/types";

export interface GuessingSession {
  state: GuessingState;
  stats: GameStats;
  submitGuess: (guess: Country) => void;
}

export function useGuessingSession(
  storage: GameStorage,
  puzzleId: string,
  answer: Country,
  dayIndex: number,
): GuessingSession {
  const [state, setState] = useState(
    () => storage.findSavedState(puzzleId, dayIndex) ?? createGuessingState(puzzleId),
  );
  const [stats, setStats] = useState(() => storage.loadStats());

  function submitGuess(guess: Country) {
    const next = applyGuess(state, guess, answer);
    setState(next);
    storage.saveState(dayIndex, next);
    if (next.status !== "playing") {
      const nextStats = applyGameResult(stats, dayIndex, next.status === "won");
      setStats(nextStats);
      storage.saveStats(nextStats);
      storage.recordResult(calculateScore(next), next.status === "won");
    }
  }

  return { state, stats, submitGuess };
}
