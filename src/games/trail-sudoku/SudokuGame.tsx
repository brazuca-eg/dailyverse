import { useMemo, useState } from "react";
import { formatElapsed } from "../../core/elapsed";
import { useDayIndex } from "../../hooks/useDayIndex";
import { useHelpDialog } from "../../hooks/useHelpDialog";
import { GameDialogs } from "../../ui/GameDialogs";
import { GameToolbar } from "../../ui/GameToolbar";
import { ResultPanel } from "../../ui/ResultPanel";
import { Board } from "./Board";
import { countDigit, calculateScore, findConflicts, MAX_SCORE, readValues } from "./game";
import { TRAIL_SUDOKU_RULE_STEPS } from "./helpText";
import { NumberPad } from "./NumberPad";
import { trailSudokuStorage } from "./persistence";
import { findDailySudokuRound } from "./daily";
import { buildShareText } from "./share";
import type { SudokuRound } from "./types";
import { SUDOKU_LAUNCH_DATE } from "./data";
import { useSudokuSession } from "./useSudokuSession";
import "./SudokuGame.css";

interface PlayProps {
  round: SudokuRound;
  dayIndex: number;
}

function SudokuPlay({ round, dayIndex }: PlayProps) {
  const { puzzle } = round;
  const session = useSudokuSession(trailSudokuStorage, round, dayIndex);
  const { state } = session;
  const hasStarted = state.moves.length > 0 || state.elapsedSeconds > 0;
  const helpDialog = useHelpDialog(trailSudokuStorage, hasStarted);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const values = useMemo(() => readValues(puzzle, state.entries), [puzzle, state.entries]);
  const conflicts = useMemo(() => new Set(findConflicts(puzzle, values)), [puzzle, values]);
  const counts = Array.from({ length: puzzle.size }, (_, index) =>
    countDigit(puzzle, state.entries, index + 1),
  );
  const isOver = state.status !== "playing";
  const shareUrl = `${window.location.origin}${window.location.pathname}`;

  return (
    <div className="sudoku-game">
      <div className="sudoku-header">
        <span className="sudoku-timer" role="timer">
          ⏱ {formatElapsed(state.elapsedSeconds)}
        </span>
        <span className="sudoku-size">
          {puzzle.size}x{puzzle.size} · {round.tier}
        </span>
        <GameToolbar onShowHelp={helpDialog.open} onShowStats={() => setIsStatsOpen(true)} />
      </div>
      <Board
        puzzle={puzzle}
        state={state}
        values={values}
        conflicts={conflicts}
        selected={session.selected}
        revealSolution={state.status === "lost"}
        onSelect={session.select}
        onDigit={session.enter}
        onErase={session.erase}
        onUndo={session.undo}
        onToggleNotes={session.toggleNotesMode}
      />
      <p className="sudoku-notice" aria-live="polite">
        {session.notice}
      </p>
      {!isOver && (
        <NumberPad
          size={puzzle.size}
          counts={counts}
          isNotesMode={session.isNotesMode}
          canUndo={state.moves.length > 0}
          onDigit={session.enter}
          onErase={session.erase}
          onUndo={session.undo}
          onToggleNotes={session.toggleNotesMode}
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
            ? `Solved in ${formatElapsed(state.elapsedSeconds)}`
            : "Here is the solution"
        }
        lostEyebrow="Gave up"
        shareText={buildShareText(state, puzzle.size, dayIndex + 1, shareUrl)}
      />
      <GameDialogs
        helpDialog={helpDialog}
        isStatsOpen={isStatsOpen}
        onCloseStats={() => setIsStatsOpen(false)}
        ruleSteps={TRAIL_SUDOKU_RULE_STEPS}
        stats={session.stats}
        dayIndex={dayIndex}
      />
    </div>
  );
}

export function SudokuGame() {
  const dayIndex = useDayIndex(SUDOKU_LAUNCH_DATE);
  const round = useMemo(() => findDailySudokuRound(dayIndex), [dayIndex]);
  if (!round) {
    return <p>Today's puzzle could not be loaded.</p>;
  }
  return <SudokuPlay round={round} dayIndex={dayIndex} />;
}
