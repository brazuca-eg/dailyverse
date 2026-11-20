import { useMemo, useRef, useState } from "react";
import { useDayIndex } from "../../hooks/useDayIndex";
import { useHelpDialog } from "../../hooks/useHelpDialog";
import { GameDialogs } from "../../ui/GameDialogs";
import { GameToolbar } from "../../ui/GameToolbar";
import { ProgressPips } from "../../ui/ProgressPips";
import { ResultPanel } from "../../ui/ResultPanel";
import { findDailyPuzzle } from "./daily";
import { DIFFERENCE_COUNT } from "./difficulty";
import {
  calculateScore,
  countLivesLeft,
  type Point,
  type SpotState,
  type TapOutcome,
} from "./game";
import { Lives } from "./Lives";
import { spotMessages as t } from "./messages";
import { spotDifferenceStorage } from "./persistence";
import { buildRuleSteps } from "./rules";
import { SceneView } from "./SceneView";
import { buildShareText } from "./share";
import type { Puzzle } from "./types";
import { useSpotSession } from "./useSpotSession";
import "./SpotGame.css";

interface SpotGameProps {
  launchDate: Date;
}

interface SpotRoundProps {
  puzzle: Puzzle;
  dayIndex: number;
}

function announce(state: SpotState, outcome: TapOutcome | null): string {
  const progress = t("spot.announce.progress", {
    found: state.found.length,
    total: DIFFERENCE_COUNT,
  });
  if (outcome === "found") {
    return t("spot.announce.found", { progress });
  }
  if (outcome === "missed") {
    return t("spot.announce.missed", {
      lives: t("spot.lives.left", { count: countLivesLeft(state) }),
      progress,
    });
  }
  return "";
}

function summarise(state: SpotState): string {
  return state.found.length === DIFFERENCE_COUNT
    ? t("spot.summary.all", { total: DIFFERENCE_COUNT })
    : t("spot.summary.some", { found: state.found.length, total: DIFFERENCE_COUNT });
}

function SpotRound({ puzzle, dayIndex }: SpotRoundProps) {
  const { state, stats, miss, lastOutcome, tap } = useSpotSession(
    spotDifferenceStorage,
    puzzle,
    dayIndex,
  );
  const hasStarted = state.found.length > 0 || state.mistakes > 0;
  const helpDialog = useHelpDialog(spotDifferenceStorage, hasStarted);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [crosshair, setCrosshair] = useState<Point | null>(null);
  const [isZoomed, setIsZoomed] = useState(false);
  const frames = useRef<(HTMLDivElement | null)[]>([null, null]);
  const isOver = state.status !== "playing";
  const shareUrl = `${window.location.origin}${window.location.pathname}`;

  function syncScroll(source: HTMLDivElement) {
    frames.current
      .filter((frame): frame is HTMLDivElement => frame !== null && frame !== source)
      .forEach((frame) => {
        if (frame.scrollLeft !== source.scrollLeft) {
          frame.scrollLeft = source.scrollLeft;
        }
        if (frame.scrollTop !== source.scrollTop) {
          frame.scrollTop = source.scrollTop;
        }
      });
  }

  const sceneProps = {
    differences: puzzle.differences,
    foundIds: state.found,
    revealAll: state.status === "lost",
    miss,
    crosshair,
    zoomed: isZoomed,
    onTap: tap,
    onCrosshairChange: setCrosshair,
    onFrameScroll: syncScroll,
  };

  return (
    <div className="spot-game">
      <div className="spot-column">
        <ProgressPips
          guessCount={state.found.length}
          status={state.status}
          total={DIFFERENCE_COUNT}
          label={t("spot.progress.label", { found: state.found.length, total: DIFFERENCE_COUNT })}
          showCurrent={false}
          actions={
            <>
              <Lives livesLeft={countLivesLeft(state)} />
              <GameToolbar onShowHelp={helpDialog.open} onShowStats={() => setIsStatsOpen(true)} />
            </>
          }
        />
      </div>
      <div className="spot-scenes">
        <SceneView
          scene={puzzle.original}
          label={t("spot.scene.first")}
          frameRef={(frame) => {
            frames.current[0] = frame;
          }}
          {...sceneProps}
        />
        <SceneView
          scene={puzzle.altered}
          label={t("spot.scene.second")}
          frameRef={(frame) => {
            frames.current[1] = frame;
          }}
          {...sceneProps}
        />
      </div>
      <p className="visually-hidden" aria-live="polite">
        {announce(state, lastOutcome)}
      </p>
      <div className="spot-controls">
        {!isOver && <p className="spot-hint">{t("spot.hint")}</p>}
        <button
          type="button"
          className="button button-secondary spot-zoom"
          aria-pressed={isZoomed}
          onClick={() => setIsZoomed(!isZoomed)}
        >
          {isZoomed ? t("spot.zoom.out") : t("spot.zoom.in")}
        </button>
      </div>
      <div className="spot-column">
        <ResultPanel
          status={state.status}
          score={calculateScore(state)}
          maxScore={DIFFERENCE_COUNT}
          summary={summarise(state)}
          lostEyebrow={t("spot.lost.eyebrow")}
          shareText={buildShareText(state, dayIndex + 1, shareUrl)}
        />
      </div>
      <GameDialogs
        helpDialog={helpDialog}
        isStatsOpen={isStatsOpen}
        onCloseStats={() => setIsStatsOpen(false)}
        ruleSteps={buildRuleSteps()}
        stats={stats}
        dayIndex={dayIndex}
      />
    </div>
  );
}

export function SpotGame({ launchDate }: SpotGameProps) {
  const dayIndex = useDayIndex(launchDate);
  const puzzle = useMemo(() => findDailyPuzzle(dayIndex), [dayIndex]);
  if (!puzzle) {
    return <p>{t("spot.load.error")}</p>;
  }
  return <SpotRound puzzle={puzzle} dayIndex={dayIndex} />;
}
