import { useArmedAction } from "../../hooks/useArmedAction";
import { tentsMessages } from "./messages";
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
        {tentsMessages("tents.control.undo")}
      </button>
      <button type="button" className="button button-secondary control" onClick={onCheck}>
        {tentsMessages("tents.control.check")}
      </button>
      <button type="button" className="button button-secondary control" onClick={onHint}>
        {tentsMessages("tents.control.hint")}
      </button>
      <button
        type="button"
        className="button button-secondary control"
        aria-pressed={clear.isArmed}
        onClick={clear.trigger}
      >
        {clear.isArmed
          ? tentsMessages("tents.control.armed")
          : tentsMessages("tents.control.clear")}
      </button>
      <button
        type="button"
        className="button button-secondary control"
        aria-pressed={giveUp.isArmed}
        onClick={giveUp.trigger}
      >
        {giveUp.isArmed
          ? tentsMessages("tents.control.armed")
          : tentsMessages("tents.control.giveUp")}
      </button>
    </div>
  );
}
