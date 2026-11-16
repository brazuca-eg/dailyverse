import { getFlagEmoji } from "../../core/flags";
import type { Country } from "../../core/types";
import { Confetti } from "../../ui/Confetti";
import { ExternalLinkIcon } from "../../ui/icons";
import { NextPuzzleCountdown } from "../../ui/NextPuzzleCountdown";
import { ShareButton } from "../../ui/ShareButton";
import { MAX_GUESSES, type GameStatus } from "./game";
import type { Reveal } from "./types";
import "./ResultPanel.css";

interface ResultPanelProps {
  status: GameStatus;
  score: number;
  answer: Country;
  reveal: Reveal;
  shareText: string;
}

export function ResultPanel({ status, score, answer, reveal, shareText }: ResultPanelProps) {
  if (status === "playing") {
    return null;
  }
  const won = status === "won";
  return (
    <section className={won ? "result result-won" : "result result-lost"} aria-live="polite">
      {won && <Confetti />}
      <div className="result-flag" aria-hidden="true">
        {getFlagEmoji(answer.code)}
      </div>
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
      <div className="fact">
        <p className="fact-label">Did you know?</p>
        <p className="fact-text">{reveal.funFact}</p>
        <a className="fact-link" href={reveal.sourceUrl} target="_blank" rel="noopener noreferrer">
          Source <ExternalLinkIcon size={14} />
        </a>
      </div>
      <pre className="share-preview">{shareText}</pre>
      <ShareButton text={shareText} />
      <NextPuzzleCountdown />
    </section>
  );
}
