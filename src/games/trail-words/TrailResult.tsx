import "../../ui/ResultPanel.css";
import { Confetti } from "../../ui/Confetti";
import { NextPuzzleCountdown } from "../../ui/NextPuzzleCountdown";
import { ShareButton } from "../../ui/ShareButton";
import { calculateScore, listMissedWords, type TrailStatus } from "./game";
import { t } from "./messages";
import { findRankProgress, readRankLabel } from "./ranks";
import type { TrailPuzzle } from "./puzzle";
import "./TrailResult.css";

interface TrailResultProps {
  puzzle: TrailPuzzle;
  found: readonly string[];
  status: TrailStatus;
  ended: boolean;
  shareText: string;
}

export function TrailResult({ puzzle, found, status, ended, shareText }: TrailResultProps) {
  if (status === "playing") {
    return null;
  }
  const won = status === "won";
  const { rank } = findRankProgress(calculateScore(puzzle, found), puzzle.maxScore);
  const missed = ended ? listMissedWords(puzzle, found) : [];
  return (
    <section className={won ? "trail-result trail-won" : "trail-result"} aria-live="polite">
      {won && !ended && <Confetti />}
      <p className="trail-eyebrow">
        {won ? t("words.result.reached", { rank: readRankLabel(rank) }) : t("words.result.ended")}
      </p>
      <h2 className="trail-title">{won ? t("words.result.won") : t("words.result.lost")}</h2>
      <pre className="share-preview">{shareText}</pre>
      <ShareButton text={shareText} />
      {ended && missed.length > 0 && (
        <div className="trail-missed">
          <h3 className="trail-missed-title">
            {t("words.result.missed", { total: missed.length })}
          </h3>
          <ul className="trail-missed-list">
            {missed.map((word) => (
              <li
                key={word}
                className={puzzle.pangrams.includes(word) ? "trail-pangram" : undefined}
              >
                {word}
              </li>
            ))}
          </ul>
        </div>
      )}
      <NextPuzzleCountdown />
    </section>
  );
}
