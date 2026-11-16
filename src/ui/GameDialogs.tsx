import type { ReactNode } from "react";
import type { HelpDialog } from "../hooks/useHelpDialog";
import type { GameStats } from "../core/streak";
import { Modal } from "./Modal";
import { RulesPanel } from "./RulesPanel";
import { StatsSummary } from "./StatsSummary";

interface GameDialogsProps {
  helpDialog: HelpDialog;
  isStatsOpen: boolean;
  onCloseStats: () => void;
  ruleSteps: readonly ReactNode[];
  ruleExample?: ReactNode;
  stats: GameStats;
  dayIndex: number;
}

export function GameDialogs({
  helpDialog,
  isStatsOpen,
  onCloseStats,
  ruleSteps,
  ruleExample,
  stats,
  dayIndex,
}: GameDialogsProps) {
  return (
    <>
      <Modal open={helpDialog.isOpen} title="How to play" onClose={helpDialog.close}>
        <RulesPanel steps={ruleSteps} example={ruleExample} onStart={helpDialog.close} />
      </Modal>
      <Modal open={isStatsOpen} title="Your stats" onClose={onCloseStats}>
        <StatsSummary stats={stats} todayDayIndex={dayIndex} />
      </Modal>
    </>
  );
}
