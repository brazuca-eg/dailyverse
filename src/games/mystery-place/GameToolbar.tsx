import { BarChartIcon, HelpCircleIcon } from "../../ui/icons";
import "./GameToolbar.css";

interface GameToolbarProps {
  onShowHelp: () => void;
  onShowStats: () => void;
}

export function GameToolbar({ onShowHelp, onShowStats }: GameToolbarProps) {
  return (
    <div className="toolbar">
      <button type="button" className="icon-button" aria-label="How to play" onClick={onShowHelp}>
        <HelpCircleIcon size={22} />
      </button>
      <button type="button" className="icon-button" aria-label="Your stats" onClick={onShowStats}>
        <BarChartIcon size={22} />
      </button>
    </div>
  );
}
