import { findRankProgress, RANKS } from "./ranks";
import "./RankBar.css";

interface RankBarProps {
  score: number;
  maxScore: number;
}

export function RankBar({ score, maxScore }: RankBarProps) {
  const progress = findRankProgress(score, maxScore);
  const top = Math.max(1, Math.ceil(maxScore * RANKS[RANKS.length - 1].share));
  const percent = Math.min(100, Math.round((score / top) * 100));
  const goal =
    progress.next === null ? "Top rank reached" : `${progress.pointsToNext} to ${progress.next}`;
  return (
    <div className="rank-bar">
      <div className="rank-row">
        <p className="rank-name">{progress.rank}</p>
        <p className="rank-score">
          {score} {score === 1 ? "point" : "points"} · {goal}
        </p>
      </div>
      <div
        className="rank-track"
        role="progressbar"
        aria-label="Rank progress"
        aria-valuemin={0}
        aria-valuemax={top}
        aria-valuenow={Math.min(score, top)}
        aria-valuetext={`${progress.rank}, ${score} points, ${goal}`}
      >
        <div className="rank-fill" style={{ width: `${percent}%` }} />
        {RANKS.slice(1).map((rank) => (
          <span
            key={rank.name}
            className="rank-mark"
            style={{ left: `${(rank.share / RANKS[RANKS.length - 1].share) * 100}%` }}
            aria-hidden="true"
          />
        ))}
      </div>
    </div>
  );
}
