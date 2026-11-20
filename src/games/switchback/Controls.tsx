import { useArmedAction } from "../../hooks/useArmedAction";
import { t } from "./messages";
import "./Controls.css";

interface ControlsProps {
  canUndo: boolean;
  onUndo: () => void;
  onReset: () => void;
  onHint: () => void;
  onGiveUp: () => void;
}

export function Controls({ canUndo, onUndo, onReset, onHint, onGiveUp }: ControlsProps) {
  const reset = useArmedAction(onReset);
  const giveUp = useArmedAction(onGiveUp);
  return (
    <div className="sw-controls">
      <button
        type="button"
        className="button button-secondary sw-control"
        disabled={!canUndo}
        onClick={onUndo}
      >
        {t("switch.controls.undo")}
      </button>
      <button
        type="button"
        className="button button-secondary sw-control"
        disabled={!canUndo}
        aria-pressed={reset.isArmed}
        onClick={reset.trigger}
      >
        {reset.isArmed ? t("switch.controls.confirm") : t("switch.controls.reset")}
      </button>
      <button type="button" className="button button-secondary sw-control" onClick={onHint}>
        {t("switch.controls.hint")}
      </button>
      <button
        type="button"
        className="button button-secondary sw-control"
        aria-pressed={giveUp.isArmed}
        onClick={giveUp.trigger}
      >
        {giveUp.isArmed ? t("switch.controls.confirm") : t("switch.controls.giveUp")}
      </button>
    </div>
  );
}
