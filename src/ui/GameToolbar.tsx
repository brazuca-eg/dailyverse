import { uiMessages as t } from "./messages";
import { BarChartIcon, HelpCircleIcon } from "./icons";
import "./GameToolbar.css";

interface GameToolbarProps {
  onShowHelp: () => void;
  onShowStats: () => void;
}

export function GameToolbar({ onShowHelp, onShowStats }: GameToolbarProps) {
  return (
    <div className="toolbar">
      <button
        type="button"
        className="icon-button"
        aria-label={t("ui.help.title")}
        onClick={onShowHelp}
      >
        <HelpCircleIcon size={22} />
      </button>
      <button
        type="button"
        className="icon-button"
        aria-label={t("ui.stats.title")}
        onClick={onShowStats}
      >
        <BarChartIcon size={22} />
      </button>
    </div>
  );
}
