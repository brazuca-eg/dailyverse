import { useArmedAction } from "../../hooks/useArmedAction";
import { t } from "./messages";
import "./Controls.css";

interface ControlsProps {
  isFlagMode: boolean;
  onToggleFlagMode: () => void;
  onHint: () => void;
  onGiveUp: () => void;
}

export function Controls({ isFlagMode, onToggleFlagMode, onHint, onGiveUp }: ControlsProps) {
  const giveUp = useArmedAction(onGiveUp);
  return (
    <div className="bs-controls">
      <button
        type="button"
        className="button button-secondary bs-control"
        aria-pressed={isFlagMode}
        onClick={onToggleFlagMode}
      >
        {t(isFlagMode ? "bear.controls.flagOn" : "bear.controls.flagOff")}
      </button>
      <button type="button" className="button button-secondary bs-control" onClick={onHint}>
        {t("bear.controls.hint")}
      </button>
      <button
        type="button"
        className="button button-secondary bs-control"
        aria-pressed={giveUp.isArmed}
        onClick={giveUp.trigger}
      >
        {t(giveUp.isArmed ? "bear.controls.tapAgain" : "bear.controls.giveUp")}
      </button>
    </div>
  );
}
