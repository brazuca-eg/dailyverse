import { calculateActiveStreak, calculateWinRatePercent, type GameStats } from "../core/streak";
import { uiMessages as t } from "./messages";
import "./StatsSummary.css";

interface StatsSummaryProps {
  stats: GameStats;
  todayDayIndex: number;
}

export function StatsSummary({ stats, todayDayIndex }: StatsSummaryProps) {
  const items = [
    { label: t("ui.stats.played"), value: String(stats.gamesPlayed) },
    { label: t("ui.stats.winRate"), value: `${calculateWinRatePercent(stats)}%` },
    { label: t("ui.stats.streak"), value: String(calculateActiveStreak(stats, todayDayIndex)) },
    { label: t("ui.stats.bestStreak"), value: String(stats.maxStreak) },
  ];
  return (
    <dl className="stats" aria-label={t("ui.stats.title")}>
      {items.map((item) => (
        <div key={item.label} className="stat">
          <dt>{item.label}</dt>
          <dd>{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
