import { useState } from "react";
import { applyGameResult, type GameStats } from "../../core/streak";
import type { Country } from "../../core/types";
import { applyGuess, createInitialState, type GameState } from "./game";
import { findSavedGameState, loadGameStats, saveGameState, saveGameStats } from "./persistence";
import type { MysteryPlacePuzzle } from "./types";

export interface GameSession {
  state: GameState;
  stats: GameStats;
  submitGuess: (guess: Country) => void;
}

export function useGameSession(
  puzzle: MysteryPlacePuzzle,
  answer: Country,
  dayIndex: number,
): GameSession {
  const [state, setState] = useState(
    () => findSavedGameState(puzzle, dayIndex) ?? createInitialState(puzzle),
  );
  const [stats, setStats] = useState(() => loadGameStats());

  function submitGuess(guess: Country) {
    const next = applyGuess(state, guess, answer);
    setState(next);
    saveGameState(dayIndex, next);
    if (next.status !== "playing") {
      const nextStats = applyGameResult(stats, dayIndex, next.status === "won");
      setStats(nextStats);
      saveGameStats(nextStats);
    }
  }

  return { state, stats, submitGuess };
}
