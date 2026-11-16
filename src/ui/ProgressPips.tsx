import type { ReactNode } from "react";
import { MAX_GUESSES, type GameStatus } from "../core/guessing";
import "./ProgressPips.css";

interface ProgressPipsProps {
  guessCount: number;
  status: GameStatus;
  actions?: ReactNode;
  total?: number;
  label?: string;
  showCurrent?: boolean;
}

function resolvePipClass(
  index: number,
  guessCount: number,
  status: GameStatus,
  showCurrent: boolean,
): string {
  if (index < guessCount) {
    const isWinningGuess = status === "won" && index === guessCount - 1;
    return isWinningGuess ? "pip pip-win" : "pip pip-used";
  }
  if (showCurrent && index === guessCount && status === "playing") {
    return "pip pip-current";
  }
  return "pip";
}

export function ProgressPips({
  guessCount,
  status,
  actions,
  total = MAX_GUESSES,
  label: customLabel,
  showCurrent = true,
}: ProgressPipsProps) {
  const defaultLabel =
    status === "playing"
      ? `Guess ${guessCount + 1} of ${total}`
      : `${guessCount} of ${total} guesses used`;
  const label = customLabel ?? defaultLabel;
  return (
    <div className="progress">
      <div className="pips" role="img" aria-label={label}>
        {Array.from({ length: total }, (_, index) => (
          <span key={index} className={resolvePipClass(index, guessCount, status, showCurrent)} />
        ))}
      </div>
      <div className="progress-row">
        <p className="progress-label">{label}</p>
        {actions}
      </div>
    </div>
  );
}
