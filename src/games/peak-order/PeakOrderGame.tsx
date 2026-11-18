import { useMemo, useState } from "react";
import { useDayIndex } from "../../hooks/useDayIndex";
import { useHelpDialog } from "../../hooks/useHelpDialog";
import { GameDialogs } from "../../ui/GameDialogs";
import { GameToolbar } from "../../ui/GameToolbar";
import { ProgressPips } from "../../ui/ProgressPips";
import { ResultPanel } from "../../ui/ResultPanel";
import { PEAK_LAUNCH_DATE } from "./data";
import { buildPrompt } from "./format";
import {
  calculateScore,
  canCheck,
  MAX_SCORE,
  readChecksLeft,
  readConfirmed,
  readStatus,
} from "./game";
import { PEAK_ORDER_RULE_STEPS } from "./helpText";
import { peakOrderStorage } from "./persistence";
import { PeakList } from "./PeakList";
import { buildDailyPeakPuzzle, type PeakPuzzle } from "./puzzle";
import { buildShareText } from "./share";
import { usePeakSession } from "./usePeakSession";
import "./PeakOrderGame.css";

interface PlayProps {
  puzzle: PeakPuzzle;
  dayIndex: number;
}

function describeChecks(left: number): string {
  return `${left} ${left === 1 ? "check" : "checks"} left`;
}

function PeakPlay({ puzzle, dayIndex }: PlayProps) {
  const session = usePeakSession(peakOrderStorage, puzzle, dayIndex);
  const { state } = session;
  const status = readStatus(state);
  const helpDialog = useHelpDialog(peakOrderStorage, state.history.length > 0);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const isOver = status !== "playing";
  const order = status === "lost" ? puzzle.items.map((_, index) => index) : state.order;
  const shareUrl = `${window.location.origin}${window.location.pathname}`;

  return (
    <div className="peak-game">
      <ProgressPips
        guessCount={state.history.length}
        status={status}
        total={5}
        label={describeChecks(readChecksLeft(state))}
        actions={
          <GameToolbar onShowHelp={helpDialog.open} onShowStats={() => setIsStatsOpen(true)} />
        }
      />
      <h2 className="peak-prompt">{buildPrompt(puzzle.category)}</h2>
      <PeakList
        puzzle={puzzle}
        order={order}
        confirmed={readConfirmed(state)}
        selected={session.selected}
        isActive={!isOver}
        isRevealed={isOver}
        focusRequest={session.focusRequest}
        onPressRow={session.pressRow}
        onShift={session.shift}
        onDrop={session.drop}
        onDeselect={session.deselect}
      />
      <p className="peak-notice" role="status">
        {session.notice}
      </p>
      {!isOver && (
        <button
          type="button"
          className="button button-primary button-block"
          disabled={!canCheck(state)}
          onClick={session.check}
        >
          Check order
        </button>
      )}
      <ResultPanel
        status={status}
        score={calculateScore(state)}
        maxScore={MAX_SCORE}
        summary={
          status === "won"
            ? `Ordered in ${state.history.length} ${state.history.length === 1 ? "check" : "checks"}`
            : "Here is the right order"
        }
        lostEyebrow="Out of checks"
        shareText={buildShareText(puzzle, state, dayIndex + 1, shareUrl)}
      />
      <GameDialogs
        helpDialog={helpDialog}
        isStatsOpen={isStatsOpen}
        onCloseStats={() => setIsStatsOpen(false)}
        ruleSteps={PEAK_ORDER_RULE_STEPS}
        stats={session.stats}
        dayIndex={dayIndex}
      />
    </div>
  );
}

export function PeakOrderGame() {
  const dayIndex = useDayIndex(PEAK_LAUNCH_DATE);
  const puzzle = useMemo(() => buildDailyPeakPuzzle(dayIndex), [dayIndex]);
  return <PeakPlay puzzle={puzzle} dayIndex={dayIndex} />;
}
