import type { ReactNode } from "react";
import type { GameStatus } from "../core/guessing";
import { Confetti } from "./Confetti";
import { ExternalLinkIcon } from "./icons";
import { NextPuzzleCountdown } from "./NextPuzzleCountdown";
import { ShareButton } from "./ShareButton";
import "./ResultPanel.css";

export interface ResultFact {
  funFact: string;
  sourceUrl: string;
}

interface ResultPanelProps {
  status: GameStatus;
  score: number;
  maxScore: number;
  summary: ReactNode;
  shareText: string;
  visual?: ReactNode;
  fact?: ResultFact;
  lostEyebrow?: string;
}

export function ResultPanel({
  status,
  score,
  maxScore,
  summary,
  shareText,
  visual,
  fact,
  lostEyebrow = "Out of guesses",
}: ResultPanelProps) {
  if (status === "playing") {
    return null;
  }
  const won = status === "won";
  return (
    <section className={won ? "result result-won" : "result result-lost"} aria-live="polite">
      {won && <Confetti />}
      {visual && (
        <div className="result-flag" aria-hidden="true">
          {visual}
        </div>
      )}
      <p className="result-eyebrow">{won ? "Solved" : lostEyebrow}</p>
      <h2 className="result-title">{won ? "You got it!" : "Not this time"}</h2>
      <p className="result-answer">{summary}</p>
      <p className="result-score">
        <span className="stars" aria-hidden="true">
          {Array.from({ length: maxScore }, (_, index) => (
            <span key={index} className={index < score ? "star star-on" : "star"}>
              ★
            </span>
          ))}
        </span>
        <span className="result-score-text">
          {score} / {maxScore} points
        </span>
      </p>
      {fact && (
        <div className="fact">
          <p className="fact-label">Did you know?</p>
          <p className="fact-text">{fact.funFact}</p>
          <a className="fact-link" href={fact.sourceUrl} target="_blank" rel="noopener noreferrer">
            Source <ExternalLinkIcon size={14} />
          </a>
        </div>
      )}
      <pre className="share-preview">{shareText}</pre>
      <ShareButton text={shareText} />
      <NextPuzzleCountdown />
    </section>
  );
}
