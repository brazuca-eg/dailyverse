import type { ReactNode } from "react";
import { MAX_GUESSES, type GameStatus } from "../core/guessing";
import type { Country } from "../core/types";
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
  answer: Country;
  shareText: string;
  visual?: ReactNode;
  fact?: ResultFact;
}

export function ResultPanel({ status, score, answer, shareText, visual, fact }: ResultPanelProps) {
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
      <p className="result-eyebrow">{won ? "Solved" : "Out of guesses"}</p>
      <h2 className="result-title">{won ? "You got it!" : "Not this time"}</h2>
      <p className="result-answer">
        The answer was <strong>{answer.name}</strong>
      </p>
      <p className="result-score">
        <span className="stars" aria-hidden="true">
          {Array.from({ length: MAX_GUESSES }, (_, index) => (
            <span key={index} className={index < score ? "star star-on" : "star"}>
              ★
            </span>
          ))}
        </span>
        <span className="result-score-text">
          {score} / {MAX_GUESSES} points
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
