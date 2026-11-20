import { useEffect, useMemo, useState } from "react";
import { useDayIndex } from "../../hooks/useDayIndex";
import { useHelpDialog } from "../../hooks/useHelpDialog";
import { GameDialogs } from "../../ui/GameDialogs";
import { GameToolbar } from "../../ui/GameToolbar";
import { Confetti } from "../../ui/Confetti";
import { pickDailyTrailPuzzle, TRAIL_LAUNCH_DATE } from "./daily";
import { decodePuzzle } from "./encode";
import { calculateScore, readStatus } from "./game";
import { FoundWords } from "./FoundWords";
import { HintPanel } from "./HintPanel";
import { Honeycomb } from "./Honeycomb";
import { EnglishWordsNote } from "./EnglishWordsNote";
import { buildRuleSteps } from "./helpText";
import { t } from "./messages";
import { trailWordsStorage } from "./persistence";
import { buildTrailPuzzle, type TrailPuzzle } from "./puzzle";
import { RankBar } from "./RankBar";
import { buildShareText } from "./share";
import { EndGameButton, TrailControls } from "./TrailControls";
import { TrailResult } from "./TrailResult";
import { useTrailKeyboard } from "./useTrailKeyboard";
import { useTrailSession } from "./useTrailSession";
import { loadWordList } from "./wordList";
import { WordInput } from "./WordInput";
import "./TrailWordsGame.css";

interface PlayProps {
  puzzle: TrailPuzzle;
  dayIndex: number;
}

function TrailPlay({ puzzle, dayIndex }: PlayProps) {
  const session = useTrailSession(trailWordsStorage, puzzle, dayIndex);
  const { state } = session;
  const helpDialog = useHelpDialog(trailWordsStorage, state.found.length > 0);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  useTrailKeyboard({
    onLetter: session.type,
    onBackspace: session.backspace,
    onSubmit: session.submit,
  });
  const score = calculateScore(puzzle, state.found);
  const status = readStatus(puzzle, state);
  const shareUrl = `${window.location.origin}${window.location.pathname}`;

  return (
    <div className="trail-game">
      <EnglishWordsNote />
      <div className="trail-top">
        <RankBar score={score} maxScore={puzzle.maxScore} />
        <GameToolbar onShowHelp={helpDialog.open} onShowStats={() => setIsStatsOpen(true)} />
      </div>
      <div className="trail-board">
        {session.toast?.tone === "pangram" && <Confetti key={session.toast.id} />}
        <WordInput
          input={session.input}
          centre={puzzle.centre}
          letters={puzzle.code}
          toast={session.toast}
        />
        <Honeycomb centre={puzzle.centre} outer={session.outer} onLetter={session.type} />
        {!state.ended && (
          <TrailControls
            canDelete={session.input.length > 0}
            canSubmit={session.input.length > 0}
            onDelete={session.backspace}
            onShuffle={session.shuffleOuter}
            onSubmit={session.submit}
          />
        )}
      </div>
      <FoundWords puzzle={puzzle} found={state.found} />
      <HintPanel puzzle={puzzle} found={state.found} />
      <TrailResult
        puzzle={puzzle}
        found={state.found}
        status={status}
        ended={state.ended}
        shareText={buildShareText(puzzle, state, dayIndex + 1, shareUrl)}
      />
      {!state.ended && <EndGameButton onEnd={session.finish} />}
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

function TrailLoading({
  code,
  failed,
  onRetry,
}: {
  code: string;
  failed: boolean;
  onRetry: () => void;
}) {
  const letters = decodePuzzle(code);
  return (
    <div className="trail-game" aria-busy={!failed}>
      <EnglishWordsNote />
      <div className="trail-board">
        <p className="trail-loading" role="status">
          {failed ? t("words.loading.failed") : t("words.loading.busy")}
        </p>
        <Honeycomb
          centre={letters.centre}
          outer={letters.outer}
          disabled
          onLetter={() => undefined}
        />
        {failed && (
          <button type="button" className="button button-primary" onClick={onRetry}>
            {t("words.loading.retry")}
          </button>
        )}
      </div>
    </div>
  );
}

export function TrailWordsGame() {
  const dayIndex = useDayIndex(TRAIL_LAUNCH_DATE);
  const pick = useMemo(() => pickDailyTrailPuzzle(dayIndex), [dayIndex]);
  const [puzzle, setPuzzle] = useState<TrailPuzzle | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let isCurrent = true;
    loadWordList().then(
      (list) => {
        if (isCurrent) {
          setPuzzle(buildTrailPuzzle(pick.code, pick.tier, list));
        }
      },
      () => {
        if (isCurrent) {
          setFailed(true);
        }
      },
    );
    return () => {
      isCurrent = false;
    };
  }, [pick, attempt]);

  function retry() {
    setFailed(false);
    setAttempt((count) => count + 1);
  }

  if (puzzle === null) {
    return <TrailLoading code={pick.code} failed={failed} onRetry={retry} />;
  }
  return <TrailPlay puzzle={puzzle} dayIndex={dayIndex} />;
}
