import { useMemo, useState } from "react";
import { formatElapsed } from "../../core/elapsed";
import { useDayIndex } from "../../hooks/useDayIndex";
import { useHelpDialog } from "../../hooks/useHelpDialog";
import { GameDialogs } from "../../ui/GameDialogs";
import { GameToolbar } from "../../ui/GameToolbar";
import { ProgressPips } from "../../ui/ProgressPips";
import { ResultPanel } from "../../ui/ResultPanel";
import { Board } from "./Board";
import { Controls } from "./Controls";
import { findDailyRound } from "./daily";
import { analyse, calculateScore, MAX_SCORE, readTents } from "./game";
import { tentsTreesStorage } from "./persistence";
import { TENTS_TREES_RULE_STEPS } from "./helpText";
import { buildShareText } from "./share";
import type { TentsRound } from "./types";
import { useTentsSession } from "./useTentsSession";
import "./TentsGame.css";

interface TentsGameProps {
  launchDate: Date;
}

interface PlayProps {
  round: TentsRound;
  dayIndex: number;
}

function TentsPlay({ round, dayIndex }: PlayProps) {
  const { puzzle } = round;
  const session = useTentsSession(tentsTreesStorage, round, dayIndex);
  const { state } = session;
  const hasStarted = state.moves.length > 0 || state.elapsedSeconds > 0;
  const helpDialog = useHelpDialog(tentsTreesStorage, hasStarted);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const analysis = useMemo(() => analyse(puzzle, state.marks), [puzzle, state.marks]);
  const placed = readTents(puzzle.size, state.marks).length;
  const isOver = state.status !== "playing";
  const shareUrl = `${window.location.origin}${window.location.pathname}`;

  return (
    <div className="tents-game">
      <ProgressPips
        guessCount={Math.min(placed, puzzle.trees.length)}
        status={state.status}
        total={puzzle.trees.length}
        label={`${placed} of ${puzzle.trees.length} tents placed`}
        showCurrent={false}
        actions={
          <>
            <span className="tents-timer" role="timer">
              ⏱ {formatElapsed(state.elapsedSeconds)}
            </span>
            <GameToolbar onShowHelp={helpDialog.open} onShowStats={() => setIsStatsOpen(true)} />
          </>
        }
      />
      <Board
        puzzle={puzzle}
        marks={state.marks}
        analysis={analysis}
        revealSolution={state.status === "lost"}
        onCycle={session.cycle}
        onPaint={session.paint}
        onUndo={session.undoMove}
      />
      <p className="tents-notice" aria-live="polite">
        {session.notice}
      </p>
      {!isOver && (
        <Controls
          canUndo={state.moves.length > 0}
          onUndo={session.undoMove}
          onClear={session.clear}
          onCheck={session.runCheck}
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
            ? `You pitched all ${puzzle.trees.length} tents`
            : "Here is where the tents were"
        }
        lostEyebrow="Gave up"
        shareText={buildShareText(state, puzzle.size, dayIndex + 1, shareUrl)}
      />
      <GameDialogs
        helpDialog={helpDialog}
        isStatsOpen={isStatsOpen}
        onCloseStats={() => setIsStatsOpen(false)}
        ruleSteps={TENTS_TREES_RULE_STEPS}
        stats={session.stats}
        dayIndex={dayIndex}
      />
    </div>
  );
}

export function TentsGame({ launchDate }: TentsGameProps) {
  const dayIndex = useDayIndex(launchDate);
  const round = useMemo(() => findDailyRound(dayIndex), [dayIndex]);
  if (!round) {
    return <p>Today's puzzle could not be loaded.</p>;
  }
  return <TentsPlay round={round} dayIndex={dayIndex} />;
}
