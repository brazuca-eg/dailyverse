import type { ReactNode } from "react";
import type { GameStats } from "../core/streak";
import { uiMessages as t } from "./messages";
import { StatsSummary } from "./StatsSummary";
import "./GameAside.css";

interface GameAsideProps {
  ruleSteps: readonly ReactNode[];
  ruleExample?: ReactNode;
  stats: GameStats;
  dayIndex: number;
}

export function GameAside({ ruleSteps, ruleExample, stats, dayIndex }: GameAsideProps) {
  return (
    <>
      <section className="aside-card">
        <h2 className="aside-heading">{t("ui.help.title")}</h2>
        <ol className="aside-steps">
          {ruleSteps.map((step, index) => (
            <li key={index}>{step}</li>
          ))}
        </ol>
        {ruleExample && (
          <div className="guess example" aria-hidden="true">
            {ruleExample}
          </div>
        )}
      </section>
      <section className="aside-card">
        <h2 className="aside-heading">{t("ui.stats.title")}</h2>
        <StatsSummary stats={stats} todayDayIndex={dayIndex} />
      </section>
    </>
  );
}
