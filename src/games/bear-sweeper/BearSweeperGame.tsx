import { useMemo, useState } from "react";
import { formatElapsed } from "../../core/elapsed";
import { useDayIndex } from "../../hooks/useDayIndex";
import { useHelpDialog } from "../../hooks/useHelpDialog";
import { GameDialogs } from "../../ui/GameDialogs";
import { GameToolbar } from "../../ui/GameToolbar";
import { ResultPanel } from "../../ui/ResultPanel";
import { Board } from "./Board";
import { countAdjacentBears } from "./counts";
import { Controls } from "./Controls";
import { BEARS_LAUNCH_DATE } from "./data";
import { findDailyBearRound } from "./daily";
import { MAX_LIVES, MAX_SCORE, calculateScore, countBearsLeft, readLivesLeft } from "./game";
import { BEAR_SWEEPER_RULE_STEPS } from "./helpText";
import { PawIcon } from "./Icons";
import { bearSweeperStorage } from "./persistence";
import { buildShareText } from "./share";
import type { BearRound } from "./types";
import { useBearSession } from "./useBearSession";
import "./BearSweeperGame.css";

interface PlayProps {
  round: BearRound;
  dayIndex: number;
}

function BearPlay({ round, dayIndex }: PlayProps) {
  const { puzzle } = round;
  const session = useBearSession(bearSweeperStorage, round, dayIndex);
  const { state } = session;
  const hasStarted = state.hints > 0 || state.elapsedSeconds > 0;
  const helpDialog = useHelpDialog(bearSweeperStorage, hasStarted);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const counts = useMemo(() => countAdjacentBears(puzzle), [puzzle]);
  const isOver = state.status !== "playing";
  const lives = readLivesLeft(state);
  const shareUrl = `${window.location.origin}${window.location.pathname}`;

  return (
    <div className="bs-game">
      <div className="bs-header">
        <span className="bs-timer" role="timer">
          ⏱ {formatElapsed(state.elapsedSeconds)}
        </span>
        <span className="bs-lives" role="img" aria-label={`${lives} of ${MAX_LIVES} lives left`}>
          {Array.from({ length: MAX_LIVES }, (_, index) => (
            <span key={index} className={index < lives ? "bs-life" : "bs-life bs-life-lost"}>
              <PawIcon size={20} />
            </span>
          ))}
        </span>
        <span className="bs-bears-left">Bears left: {countBearsLeft(state, puzzle)}</span>
        <GameToolbar onShowHelp={helpDialog.open} onShowStats={() => setIsStatsOpen(true)} />
      </div>
      <Board
        puzzle={puzzle}
        state={state}
        counts={counts}
        revealBears={state.status === "lost"}
        isActive={!isOver}
        onPress={session.press}
        onFlag={session.flag}
      />
      <p className="bs-notice" role="status">
        {session.notice}
      </p>
      {!isOver && (
        <Controls
          isFlagMode={session.isFlagMode}
          onToggleFlagMode={session.toggleFlagMode}
          onHint={session.hint}
          onGiveUp={session.surrender}
        />
      )}
      <ResultPanel
        status={state.status}
        score={calculateScore(state)}
        maxScore={MAX_SCORE}
        summary={
          state.status === "won"
            ? `All clear in ${formatElapsed(state.elapsedSeconds)}`
            : "Here is where the bears were"
        }
        lostEyebrow="Chased off"
        shareText={buildShareText(state, puzzle.size, dayIndex + 1, shareUrl)}
      />
      <GameDialogs
        helpDialog={helpDialog}
        isStatsOpen={isStatsOpen}
        onCloseStats={() => setIsStatsOpen(false)}
        ruleSteps={BEAR_SWEEPER_RULE_STEPS}
        stats={session.stats}
        dayIndex={dayIndex}
      />
    </div>
  );
}

export function BearSweeperGame() {
  const dayIndex = useDayIndex(BEARS_LAUNCH_DATE);
  const round = useMemo(() => findDailyBearRound(dayIndex), [dayIndex]);
  if (!round) {
    return <p>Today's puzzle could not be loaded.</p>;
  }
  return <BearPlay round={round} dayIndex={dayIndex} />;
}
