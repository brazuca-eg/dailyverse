import type { ReactNode } from "react";
import { MAX_GUESSES, type GameStatus } from "./game";
import "./ProgressPips.css";

interface ProgressPipsProps {
  guessCount: number;
  status: GameStatus;
  actions?: ReactNode;
}

function resolvePipClass(index: number, guessCount: number, status: GameStatus): string {
  if (index < guessCount) {
    const isWinningGuess = status === "won" && index === guessCount - 1;
    return isWinningGuess ? "pip pip-win" : "pip pip-used";
  }
  if (index === guessCount && status === "playing") {
    return "pip pip-current";
  }
  return "pip";
}

export function ProgressPips({ guessCount, status, actions }: ProgressPipsProps) {
  const label =
    status === "playing"
      ? `Guess ${guessCount + 1} of ${MAX_GUESSES}`
      : `${guessCount} of ${MAX_GUESSES} guesses used`;
  return (
    <div className="progress">
      <div className="pips" role="img" aria-label={label}>
        {Array.from({ length: MAX_GUESSES }, (_, index) => (
          <span key={index} className={resolvePipClass(index, guessCount, status)} />
        ))}
      </div>
      <div className="progress-row">
        <p className="progress-label">{label}</p>
        {actions}
      </div>
    </div>
  );
}
