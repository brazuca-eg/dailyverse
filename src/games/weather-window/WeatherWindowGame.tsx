import { useMemo, useState } from "react";
import { useDayIndex } from "../../hooks/useDayIndex";
import { useHelpDialog } from "../../hooks/useHelpDialog";
import { GameDialogs } from "../../ui/GameDialogs";
import { GameToolbar } from "../../ui/GameToolbar";
import { ResultPanel } from "../../ui/ResultPanel";
import { Controls } from "./Controls";
import { WEATHER_LAUNCH_DATE } from "./data";
import { findDailyWeatherRound } from "./daily";
import { FitGuide } from "./FitGuide";
import { Forecast } from "./Forecast";
import { MAX_SCORE, calculateScore, isPlanComplete, readPlanShare } from "./game";
import { buildWeatherWindowRuleSteps } from "./helpText";
import { t } from "./messages";
import { Review } from "./Review";
import { analysePuzzle, scorePlan } from "./solver";
import { buildShareText } from "./share";
import { weatherWindowStorage } from "./persistence";
import { Trips } from "./Trips";
import type { WeatherRound } from "./types";
import { useWeatherSession } from "./useWeatherSession";
import "./WeatherWindowGame.css";

interface PlayProps {
  round: WeatherRound;
  dayIndex: number;
}

function WeatherPlay({ round, dayIndex }: PlayProps) {
  const { puzzle } = round;
  const session = useWeatherSession(weatherWindowStorage, round, dayIndex);
  const { state } = session;
  const helpDialog = useHelpDialog(weatherWindowStorage, state.phase !== "intro");
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const shareUrl = `${window.location.origin}${window.location.pathname}`;
  const isPlanning = state.phase === "plan";
  const isDone = state.phase === "done";
  const best = analysePuzzle(puzzle).best;
  const isRevealed = (day: number) =>
    state.phase === "memorise" || isDone || session.peekedDay === day;

  return (
    <div className="ww-game">
      <div className="ww-header">
        <span className="ww-phase">
          {state.phase === "memorise"
            ? t("weather.game.memorise", { seconds: session.secondsLeft })
            : null}
          {isPlanning ? t("weather.game.plan") : null}
          {state.phase === "intro" ? t("weather.game.ready") : null}
          {isDone ? t("weather.game.score", { points: scorePlan(puzzle, state.plan), best }) : null}
        </span>
        <GameToolbar onShowHelp={helpDialog.open} onShowStats={() => setIsStatsOpen(true)} />
      </div>
      <Forecast
        puzzle={puzzle}
        plan={state.plan}
        isRevealed={isRevealed}
        isActive={isPlanning}
        selectedTrip={session.selectedTrip}
        isPeekArmed={session.isPeekArmed}
        onTapDay={session.tapDay}
      />
      <p className="ww-notice" role="status">
        {session.notice}
      </p>
      {state.phase === "intro" && (
        <button type="button" className="button ww-start" onClick={session.start}>
          {t("weather.game.show")}
        </button>
      )}
      {state.phase === "memorise" && (
        <button type="button" className="button ww-start" onClick={session.ready}>
          {t("weather.game.imReady")}
        </button>
      )}
      {isPlanning && (
        <>
          <Trips
            puzzle={puzzle}
            plan={state.plan}
            selectedTrip={session.selectedTrip}
            isActive
            onSelect={session.selectTrip}
          />
          <Controls
            isPeekArmed={session.isPeekArmed}
            peeksLeft={session.peeksLeft}
            canSubmit={isPlanComplete(state)}
            onTogglePeek={session.togglePeek}
            onSubmit={session.submit}
          />
        </>
      )}
      {isDone && <Review puzzle={puzzle} plan={state.plan} />}
      <FitGuide trips={puzzle.trips} />
      <ResultPanel
        status={state.status}
        score={calculateScore(state, puzzle)}
        maxScore={MAX_SCORE}
        summary={
          isDone
            ? t("weather.game.summary", {
                points: scorePlan(puzzle, state.plan),
                best,
                percent: Math.round(readPlanShare(state.plan, puzzle) * 100),
              })
            : ""
        }
        lostEyebrow={t("weather.game.washedOut")}
        shareText={isDone ? buildShareText(state, puzzle, dayIndex + 1, shareUrl) : ""}
      />
      <GameDialogs
        helpDialog={helpDialog}
        isStatsOpen={isStatsOpen}
        onCloseStats={() => setIsStatsOpen(false)}
        ruleSteps={buildWeatherWindowRuleSteps()}
        stats={session.stats}
        dayIndex={dayIndex}
      />
    </div>
  );
}

export function WeatherWindowGame() {
  const dayIndex = useDayIndex(WEATHER_LAUNCH_DATE);
  const round = useMemo(() => findDailyWeatherRound(dayIndex), [dayIndex]);
  if (!round) {
    return <p>{t("weather.game.loadError")}</p>;
  }
  return <WeatherPlay round={round} dayIndex={dayIndex} />;
}
