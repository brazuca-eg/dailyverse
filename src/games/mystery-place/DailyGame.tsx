import { useState } from "react";
import type { Country } from "../../core/types";
import { Modal } from "../../ui/Modal";
import { StatsSummary } from "../../ui/StatsSummary";
import { CluesList } from "./CluesList";
import { calculateScore, countVisibleClues } from "./game";
import { GameToolbar } from "./GameToolbar";
import { GuessHistory } from "./GuessHistory";
import { GuessInput } from "./GuessInput";
import { HowToPlay } from "./HowToPlay";
import { ProgressPips } from "./ProgressPips";
import { ResultPanel } from "./ResultPanel";
import { buildShareText } from "./share";
import type { MysteryPlacePuzzle } from "./types";
import { useGameSession } from "./useGameSession";
import { useHelpDialog } from "./useHelpDialog";
import "./DailyGame.css";

interface DailyGameProps {
  puzzle: MysteryPlacePuzzle;
  answer: Country;
  countries: readonly Country[];
  dayIndex: number;
}

export function DailyGame({ puzzle, answer, countries, dayIndex }: DailyGameProps) {
  const { state, stats, submitGuess } = useGameSession(puzzle, answer, dayIndex);
  const helpDialog = useHelpDialog(state.guesses.length > 0);
  const [isStatsOpen, setIsStatsOpen] = useState(false);

  const isPlaying = state.status === "playing";
  const visibleCount = countVisibleClues(state, puzzle.clues.length);
  const guessedCodes = state.guesses.map((guess) => guess.countryCode);
  const shareUrl = `${window.location.origin}${window.location.pathname}`;

  return (
    <div className="game">
      <ProgressPips
        guessCount={state.guesses.length}
        status={state.status}
        actions={
          <GameToolbar onShowHelp={helpDialog.open} onShowStats={() => setIsStatsOpen(true)} />
        }
      />
      <CluesList
        clues={puzzle.clues}
        visibleCount={visibleCount}
        highlightIndex={isPlaying ? visibleCount - 1 : null}
      />
      <GuessHistory guesses={state.guesses} countries={countries} />
      {isPlaying && (
        <GuessInput
          countries={countries}
          excludedCodes={guessedCodes}
          onSubmitGuess={submitGuess}
        />
      )}
      <ResultPanel
        status={state.status}
        score={calculateScore(state)}
        answer={answer}
        reveal={puzzle.reveal}
        shareText={buildShareText(state, dayIndex + 1, shareUrl)}
      />
      <Modal open={helpDialog.isOpen} title="How to play" onClose={helpDialog.close}>
        <HowToPlay onStart={helpDialog.close} />
      </Modal>
      <Modal open={isStatsOpen} title="Your stats" onClose={() => setIsStatsOpen(false)}>
        <StatsSummary stats={stats} todayDayIndex={dayIndex} />
      </Modal>
    </div>
  );
}
