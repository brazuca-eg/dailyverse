import { useState } from "react";
import { formatUtcDate } from "../core/doneToday";
import { loadGameStats } from "../core/gameStorage";
import { loadHistory } from "../core/history";
import { buildDayCells, summarise, summariseByGame } from "../core/overview";
import { readCurrentLocale, buildLocalePath } from "../i18n/locales";
import { siteMessages } from "../i18n/site";
import { statsMessages as t } from "../i18n/stats";
import { ShareButton } from "../ui/ShareButton";
import { listGameGroups, listGroupGames } from "./games";
import "./StatsOverview.css";

const ACTIVITY_DAYS = 28;
const TOTAL_GAMES = listGameGroups().reduce((sum, group) => sum + group.slugs.length, 0);

function readLevel(count: number): number {
  return Math.min(count, 3);
}

export function StatsOverview() {
  const locale = readCurrentLocale();
  const [todayDate] = useState(() => formatUtcDate(new Date()));
  const [history] = useState(() => loadHistory());
  const overview = summarise(history, todayDate);
  const totals = summariseByGame(history);
  const siteUrl = `${window.location.origin}${buildLocalePath(locale)}`;
  const inviteText = [
    overview.currentStreak > 0
      ? t("stats.invite.textStreak", { days: overview.currentStreak })
      : t("stats.invite.text"),
    siteUrl,
  ].join("\n");
  const tiles = [
    { label: t("stats.streak"), value: String(overview.currentStreak) },
    { label: t("stats.bestStreak"), value: String(overview.bestStreak) },
    { label: t("stats.points"), value: String(overview.totalPoints) },
    { label: t("stats.played"), value: String(overview.played) },
    { label: t("stats.winRate"), value: `${overview.winRate}%` },
    { label: t("stats.average"), value: String(overview.averageScore) },
  ];

  return (
    <div className="so">
      {history.length === 0 && <p className="so-empty">{t("stats.empty")}</p>}
      <dl className="so-tiles">
        {tiles.map((tile) => (
          <div key={tile.label} className="so-tile">
            <dt>{tile.label}</dt>
            <dd>{tile.value}</dd>
          </div>
        ))}
      </dl>
      <section className="so-section" aria-labelledby="so-today">
        <h2 id="so-today" className="so-heading">
          {t("stats.today")}
        </h2>
        <p className="so-progress-text">
          {t("stats.todayProgress", { count: overview.playedToday, total: TOTAL_GAMES })}
        </p>
        <progress
          className="so-progress"
          value={overview.playedToday}
          max={TOTAL_GAMES}
          aria-label={t("stats.todayProgress", { count: overview.playedToday, total: TOTAL_GAMES })}
        />
      </section>
      <section className="so-section" aria-labelledby="so-activity">
        <h2 id="so-activity" className="so-heading">
          {t("stats.activity")}
        </h2>
        <ol className="so-activity">
          {buildDayCells(history, todayDate, ACTIVITY_DAYS).map((cell) => (
            <li
              key={cell.date}
              className="so-day"
              data-level={readLevel(cell.count)}
              aria-label={t("stats.cell", {
                date: cell.date,
                count: cell.count,
                points: cell.points,
              })}
            >
              {cell.count > 0 ? cell.count : ""}
            </li>
          ))}
        </ol>
      </section>
      <section className="so-section" aria-labelledby="so-games">
        <h2 id="so-games" className="so-heading">
          {t("stats.byGame")}
        </h2>
        <div className="so-table-wrap">
          <table className="so-table">
            <thead>
              <tr>
                <th scope="col">{t("stats.col.game")}</th>
                <th scope="col">{t("stats.col.played")}</th>
                <th scope="col">{t("stats.col.won")}</th>
                <th scope="col">{t("stats.col.best")}</th>
                <th scope="col">{t("stats.col.points")}</th>
              </tr>
            </thead>
            <tbody>
              {listGameGroups().flatMap((group) =>
                listGroupGames(group).map((game) => {
                  const total = totals.get(game.storageId);
                  return (
                    <tr key={game.slug}>
                      <th scope="row">
                        <a href={buildLocalePath(locale, game.slug)}>
                          {game.readMeta(locale, "title")}
                        </a>
                      </th>
                      <td>{total?.played ?? 0}</td>
                      <td>{total?.wins ?? 0}</td>
                      <td>{loadGameStats(game.storageId).maxStreak}</td>
                      <td>{total?.points ?? 0}</td>
                    </tr>
                  );
                }),
              )}
            </tbody>
          </table>
        </div>
      </section>
      <section className="so-section so-invite" aria-labelledby="so-invite">
        <h2 id="so-invite" className="so-heading">
          {t("stats.invite.title")}
        </h2>
        <p className="so-progress-text">{t("stats.invite.lead")}</p>
        <ShareButton text={inviteText} idleLabel={t("stats.invite.button")} />
      </section>
      <p className="so-note">{t("stats.note")}</p>
      <a className="back-link" href={buildLocalePath(locale)}>
        <span aria-hidden="true">←</span> {siteMessages("site.menu.home")}
      </a>
    </div>
  );
}
