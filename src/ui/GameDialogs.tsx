import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import type { HelpDialog } from "../hooks/useHelpDialog";
import type { GameStats } from "../core/streak";
import { GameAside } from "./GameAside";
import { uiMessages as t } from "./messages";
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
  const asideSlot = document.getElementById("game-aside-slot");
  return (
    <>
      {asideSlot &&
        createPortal(
          <GameAside
            ruleSteps={ruleSteps}
            ruleExample={ruleExample}
            stats={stats}
            dayIndex={dayIndex}
          />,
          asideSlot,
        )}
      <Modal open={helpDialog.isOpen} title={t("ui.help.title")} onClose={helpDialog.close}>
        <RulesPanel steps={ruleSteps} example={ruleExample} onStart={helpDialog.close} />
      </Modal>
      <Modal open={isStatsOpen} title={t("ui.stats.title")} onClose={onCloseStats}>
        <StatsSummary stats={stats} todayDayIndex={dayIndex} />
      </Modal>
    </>
  );
}
