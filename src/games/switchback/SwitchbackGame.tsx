import { useMemo, useState } from "react";
import { formatElapsed } from "../../core/elapsed";
import { useDayIndex } from "../../hooks/useDayIndex";
import { useHelpDialog } from "../../hooks/useHelpDialog";
import { GameDialogs } from "../../ui/GameDialogs";
import { GameToolbar } from "../../ui/GameToolbar";
import { ResultPanel } from "../../ui/ResultPanel";
import { Board } from "./Board";
import { Controls } from "./Controls";
import { SWITCHBACK_LAUNCH_DATE } from "./data";
import { findDailySwitchbackRound } from "./daily";
import { calculateScore, countCells, countReachedMarks, MAX_SCORE } from "./game";
import { SWITCHBACK_RULE_STEPS } from "./helpText";
import { switchbackStorage } from "./persistence";
import { buildShareText } from "./share";
import type { SwitchbackRound } from "./types";
import { useSwitchbackSession } from "./useSwitchbackSession";
import "./SwitchbackGame.css";

interface PlayProps {
  round: SwitchbackRound;
  dayIndex: number;
}

function SwitchbackPlay({ round, dayIndex }: PlayProps) {
  const { puzzle, solution } = round;
  const session = useSwitchbackSession(switchbackStorage, round, dayIndex);
  const { state } = session;
  const hasStarted = state.path.length > 1 || state.elapsedSeconds > 0;
  const helpDialog = useHelpDialog(switchbackStorage, hasStarted);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const isOver = state.status !== "playing";
  const shareUrl = `${window.location.origin}${window.location.pathname}`;
  const covered = state.path.length;
  const cells = countCells(puzzle);

  return (
    <div className="sw-game">
      <div className="sw-header">
        <span className="sw-timer" role="timer">
          ⏱ {formatElapsed(state.elapsedSeconds)}
        </span>
        <span className="sw-size">
          {puzzle.size}x{puzzle.size} · {round.tier}
        </span>
        <GameToolbar onShowHelp={helpDialog.open} onShowStats={() => setIsStatsOpen(true)} />
      </div>
      <Board
        puzzle={puzzle}
        path={state.path}
        solution={solution}
        revealSolution={state.status === "lost"}
        isActive={!isOver}
        onMove={session.move}
        onStep={session.step}
        onUndo={session.undo}
        onReset={session.reset}
      />
      <p className="sw-progress">
        {covered} of {cells} squares · checkpoint{" "}
        {Math.min(countReachedMarks(puzzle, state.path), puzzle.marks.length)} of{" "}
        {puzzle.marks.length}
      </p>
      <p className="sw-notice" role="status">
        {session.notice}
      </p>
      {!isOver && (
        <Controls
          canUndo={state.path.length > 1}
          onUndo={session.undo}
          onReset={session.reset}
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
            ? `Summit reached in ${formatElapsed(state.elapsedSeconds)}`
            : "Here is the route"
        }
        lostEyebrow="Gave up"
        shareText={buildShareText(state, puzzle.size, dayIndex + 1, shareUrl)}
      />
      <GameDialogs
        helpDialog={helpDialog}
        isStatsOpen={isStatsOpen}
        onCloseStats={() => setIsStatsOpen(false)}
        ruleSteps={SWITCHBACK_RULE_STEPS}
        stats={session.stats}
        dayIndex={dayIndex}
      />
    </div>
  );
}

export function SwitchbackGame() {
  const dayIndex = useDayIndex(SWITCHBACK_LAUNCH_DATE);
  const round = useMemo(() => findDailySwitchbackRound(dayIndex), [dayIndex]);
  if (!round) {
    return <p>Today's puzzle could not be loaded.</p>;
  }
  return <SwitchbackPlay round={round} dayIndex={dayIndex} />;
}
