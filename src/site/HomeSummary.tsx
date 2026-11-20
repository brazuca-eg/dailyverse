import { useState } from "react";
import { formatUtcDate } from "../core/doneToday";
import { loadHistory } from "../core/history";
import { summarise } from "../core/overview";
import { buildLocalePath, readCurrentLocale } from "../i18n/locales";
import { statsMessages as t } from "../i18n/stats";
import { listGameGroups } from "./games";
import "./HomeSummary.css";

const TOTAL_GAMES = listGameGroups().reduce((sum, group) => sum + group.slugs.length, 0);

export function HomeSummary() {
  const [overview] = useState(() => summarise(loadHistory(), formatUtcDate(new Date())));
  const items = [
    { label: t("stats.streak"), value: overview.currentStreak },
    { label: t("stats.points"), value: overview.totalPoints },
  ];
  return (
    <aside className="hs" aria-label={t("stats.title")}>
      <p className="hs-today">
        {t("stats.todayProgress", { count: overview.playedToday, total: TOTAL_GAMES })}
      </p>
      <dl className="hs-items">
        {items.map((item) => (
          <div key={item.label} className="hs-item">
            <dt>{item.label}</dt>
            <dd>{item.value}</dd>
          </div>
        ))}
      </dl>
      <a className="hs-link" href={buildLocalePath(readCurrentLocale(), "stats")}>
        {t("stats.link")}
      </a>
    </aside>
  );
}
