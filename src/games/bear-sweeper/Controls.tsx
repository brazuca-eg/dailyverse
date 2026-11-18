import { useArmedAction } from "../../hooks/useArmedAction";
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
        Flag mode {isFlagMode ? "on" : "off"}
      </button>
      <button type="button" className="button button-secondary bs-control" onClick={onHint}>
        Hint
      </button>
      <button
        type="button"
        className="button button-secondary bs-control"
        aria-pressed={giveUp.isArmed}
        onClick={giveUp.trigger}
      >
        {giveUp.isArmed ? "Tap again" : "Give up"}
      </button>
    </div>
  );
}
