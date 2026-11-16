import { useArmedAction } from "../../hooks/useArmedAction";
import "./Controls.css";

interface ControlsProps {
  canUndo: boolean;
  onUndo: () => void;
  onClear: () => void;
  onCheck: () => void;
  onHint: () => void;
  onGiveUp: () => void;
}

export function Controls({ canUndo, onUndo, onClear, onCheck, onHint, onGiveUp }: ControlsProps) {
  const clear = useArmedAction(onClear);
  const giveUp = useArmedAction(onGiveUp);
  return (
    <div className="controls">
      <button
        type="button"
        className="button button-secondary control"
        disabled={!canUndo}
        onClick={onUndo}
      >
        Undo
      </button>
      <button type="button" className="button button-secondary control" onClick={onCheck}>
        Check
      </button>
      <button type="button" className="button button-secondary control" onClick={onHint}>
        Hint
      </button>
      <button
        type="button"
        className="button button-secondary control"
        aria-pressed={clear.isArmed}
        onClick={clear.trigger}
      >
        {clear.isArmed ? "Tap again" : "Clear"}
      </button>
      <button
        type="button"
        className="button button-secondary control"
        aria-pressed={giveUp.isArmed}
        onClick={giveUp.trigger}
      >
        {giveUp.isArmed ? "Tap again" : "Give up"}
      </button>
    </div>
  );
}
