import { calculateActiveStreak, calculateWinRatePercent, type GameStats } from "../core/streak";
import "./StatsSummary.css";

interface StatsSummaryProps {
  stats: GameStats;
  todayDayIndex: number;
}

export function StatsSummary({ stats, todayDayIndex }: StatsSummaryProps) {
  const items = [
    { label: "Played", value: String(stats.gamesPlayed) },
    { label: "Win rate", value: `${calculateWinRatePercent(stats)}%` },
    { label: "Streak", value: String(calculateActiveStreak(stats, todayDayIndex)) },
    { label: "Best streak", value: String(stats.maxStreak) },
  ];
  return (
    <dl className="stats" aria-label="Your stats">
      {items.map((item) => (
        <div key={item.label} className="stat">
          <dt>{item.label}</dt>
          <dd>{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
