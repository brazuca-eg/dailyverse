import { useArmedAction } from "../../hooks/useArmedAction";
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
        Undo
      </button>
      <button
        type="button"
        className="button button-secondary sw-control"
        disabled={!canUndo}
        aria-pressed={reset.isArmed}
        onClick={reset.trigger}
      >
        {reset.isArmed ? "Tap again" : "Reset"}
      </button>
      <button type="button" className="button button-secondary sw-control" onClick={onHint}>
        Hint
      </button>
      <button
        type="button"
        className="button button-secondary sw-control"
        aria-pressed={giveUp.isArmed}
        onClick={giveUp.trigger}
      >
        {giveUp.isArmed ? "Tap again" : "Give up"}
      </button>
    </div>
  );
}
