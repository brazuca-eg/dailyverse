import { useState, type ReactNode } from "react";
import type { GameStorage } from "../core/gameStorage";
import { calculateScore, type GuessingState } from "../core/guessing";
import { buildShareText } from "../core/share";
import type { Country } from "../core/types";
import { useGuessingSession } from "../hooks/useGuessingSession";
import { useHelpDialog } from "../hooks/useHelpDialog";
import { GameToolbar } from "./GameToolbar";
import { GuessHistory } from "./GuessHistory";
import { GuessInput } from "./GuessInput";
import { Modal } from "./Modal";
import { ProgressPips } from "./ProgressPips";
import { ResultPanel, type ResultFact } from "./ResultPanel";
import { RulesPanel } from "./RulesPanel";
import { StatsSummary } from "./StatsSummary";
import "./GuessingGame.css";

interface GuessingGameProps {
  gameTitle: string;
  storage: GameStorage;
  puzzleId: string;
  answer: Country;
  countries: readonly Country[];
  dayIndex: number;
  ruleSteps: readonly ReactNode[];
  ruleExample?: ReactNode;
  renderStage: (state: GuessingState) => ReactNode;
  resultVisual?: ReactNode;
  resultFact?: ResultFact;
  showFlags?: boolean;
}

export function GuessingGame({
  gameTitle,
  storage,
  puzzleId,
  answer,
  countries,
  dayIndex,
  ruleSteps,
  ruleExample,
  renderStage,
  resultVisual,
  resultFact,
  showFlags = true,
}: GuessingGameProps) {
  const { state, stats, submitGuess } = useGuessingSession(storage, puzzleId, answer, dayIndex);
  const helpDialog = useHelpDialog(storage, state.guesses.length > 0);
  const [isStatsOpen, setIsStatsOpen] = useState(false);

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
      {renderStage(state)}
      <GuessHistory guesses={state.guesses} countries={countries} showFlags={showFlags} />
      {state.status === "playing" && (
        <GuessInput
          countries={countries}
          excludedCodes={guessedCodes}
          onSubmitGuess={submitGuess}
          showFlags={showFlags}
        />
      )}
      <ResultPanel
        status={state.status}
        score={calculateScore(state)}
        answer={answer}
        shareText={buildShareText(gameTitle, state, dayIndex + 1, shareUrl)}
        visual={resultVisual}
        fact={resultFact}
      />
      <Modal open={helpDialog.isOpen} title="How to play" onClose={helpDialog.close}>
        <RulesPanel steps={ruleSteps} example={ruleExample} onStart={helpDialog.close} />
      </Modal>
      <Modal open={isStatsOpen} title="Your stats" onClose={() => setIsStatsOpen(false)}>
        <StatsSummary stats={stats} todayDayIndex={dayIndex} />
      </Modal>
    </div>
  );
}
