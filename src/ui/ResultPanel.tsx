import type { ReactNode } from "react";
import { formatUtcDate } from "../core/doneToday";
import type { GameStatus } from "../core/guessing";
import { loadHistory } from "../core/history";
import { calculateCurrentStreak } from "../core/overview";
import { frameShareText } from "../core/shareFrame";
import { Confetti } from "./Confetti";
import { ExternalLinkIcon } from "./icons";
import { NextPuzzleCountdown } from "./NextPuzzleCountdown";
import { uiMessages as t } from "./messages";
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
  lostEyebrow,
}: ResultPanelProps) {
  if (status === "playing") {
    return null;
  }
  const won = status === "won";
  const streak = calculateCurrentStreak(loadHistory(), formatUtcDate(new Date()));
  const framedText = frameShareText(shareText, {
    streakLine: streak >= 2 ? t("ui.share.streak", { days: streak }) : null,
    callLine: t("ui.share.call"),
  });
  return (
    <section className={won ? "result result-won" : "result result-lost"} aria-live="polite">
      {won && <Confetti />}
      {visual && (
        <div className="result-flag" aria-hidden="true">
          {visual}
        </div>
      )}
      <p className="result-eyebrow">
        {won ? t("ui.result.solved") : (lostEyebrow ?? t("ui.result.outOfGuesses"))}
      </p>
      <h2 className="result-title">{won ? t("ui.result.won") : t("ui.result.lost")}</h2>
      <p className="result-answer">{summary}</p>
      <p className="result-score">
        <span className="stars" aria-hidden="true">
          {Array.from({ length: maxScore }, (_, index) => (
            <span key={index} className={index < score ? "star star-on" : "star"}>
              ★
            </span>
          ))}
        </span>
        <span className="result-score-text">{t("ui.result.score", { score, max: maxScore })}</span>
      </p>
      {fact && (
        <div className="fact">
          <p className="fact-label">{t("ui.result.fact")}</p>
          <p className="fact-text">{fact.funFact}</p>
          <a className="fact-link" href={fact.sourceUrl} target="_blank" rel="noopener noreferrer">
            {t("ui.result.source")} <ExternalLinkIcon size={14} />
          </a>
        </div>
      )}
      <pre className="share-preview">{framedText}</pre>
      <ShareButton text={framedText} />
      <NextPuzzleCountdown />
    </section>
  );
}
