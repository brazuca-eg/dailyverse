import { useMemo, useState } from "react";
import { useDayIndex } from "../../hooks/useDayIndex";
import { useLocaleData } from "../../hooks/useLocaleData";
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
import { buildRuleSteps } from "./helpText";
import { peakMessages as t } from "./messages";
import { peakOrderStorage } from "./persistence";
import { loadLocalNames, localisePuzzle } from "./localNames";
import { PeakList } from "./PeakList";
import { buildDailyPeakPuzzle, type PeakPuzzle } from "./puzzle";
import { buildShareText } from "./share";
import { usePeakSession } from "./usePeakSession";
import "./PeakOrderGame.css";

interface PlayProps {
  puzzle: PeakPuzzle;
  dayIndex: number;
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
        label={t("peak.checksLeft", { count: readChecksLeft(state) })}
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
          {t("peak.check")}
        </button>
      )}
      <ResultPanel
        status={status}
        score={calculateScore(state)}
        maxScore={MAX_SCORE}
        summary={
          status === "won"
            ? t("peak.result.won", { count: state.history.length })
            : t("peak.result.lost")
        }
        lostEyebrow={t("peak.result.lostEyebrow")}
        shareText={buildShareText(puzzle, state, dayIndex + 1, shareUrl)}
      />
      <GameDialogs
        helpDialog={helpDialog}
        isStatsOpen={isStatsOpen}
        onCloseStats={() => setIsStatsOpen(false)}
        ruleSteps={buildRuleSteps()}
        stats={session.stats}
        dayIndex={dayIndex}
      />
    </div>
  );
}

export function PeakOrderGame() {
  const dayIndex = useDayIndex(PEAK_LAUNCH_DATE);
  const names = useLocaleData(loadLocalNames);
  const puzzle = useMemo(
    () => localisePuzzle(buildDailyPeakPuzzle(dayIndex), names),
    [dayIndex, names],
  );
  return <PeakPlay puzzle={puzzle} dayIndex={dayIndex} />;
}
