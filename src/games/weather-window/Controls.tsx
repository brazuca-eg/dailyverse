import { t } from "./messages";
import "./Controls.css";

interface ControlsProps {
  isPeekArmed: boolean;
  peeksLeft: number;
  canSubmit: boolean;
  onTogglePeek: () => void;
  onSubmit: () => void;
}

export function Controls({
  isPeekArmed,
  peeksLeft,
  canSubmit,
  onTogglePeek,
  onSubmit,
}: ControlsProps) {
  return (
    <div className="ww-controls">
      <button
        type="button"
        className="button button-secondary ww-control"
        aria-pressed={isPeekArmed}
        disabled={peeksLeft === 0 && !isPeekArmed}
        onClick={onTogglePeek}
      >
        {isPeekArmed ? t("weather.controls.pick") : t("weather.controls.peek", { left: peeksLeft })}
      </button>
      <button type="button" className="button ww-control" disabled={!canSubmit} onClick={onSubmit}>
        {t("weather.controls.submit")}
      </button>
    </div>
  );
}
