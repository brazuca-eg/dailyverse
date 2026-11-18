import { useArmedAction } from "../../hooks/useArmedAction";
import "./TrailControls.css";

interface TrailControlsProps {
  canDelete: boolean;
  canSubmit: boolean;
  onDelete: () => void;
  onShuffle: () => void;
  onSubmit: () => void;
}

export function TrailControls({
  canDelete,
  canSubmit,
  onDelete,
  onShuffle,
  onSubmit,
}: TrailControlsProps) {
  return (
    <div className="trail-controls">
      <button
        type="button"
        className="button button-secondary trail-control"
        disabled={!canDelete}
        onClick={onDelete}
      >
        Delete
      </button>
      <button type="button" className="button button-secondary trail-control" onClick={onShuffle}>
        Shuffle
      </button>
      <button
        type="button"
        className="button button-primary trail-control"
        disabled={!canSubmit}
        onClick={onSubmit}
      >
        Enter
      </button>
    </div>
  );
}

interface EndGameButtonProps {
  onEnd: () => void;
}

export function EndGameButton({ onEnd }: EndGameButtonProps) {
  const armed = useArmedAction(onEnd);
  return (
    <button
      type="button"
      className="button button-secondary trail-end"
      aria-pressed={armed.isArmed}
      onClick={armed.trigger}
    >
      {armed.isArmed ? "Tap again to end the game" : "End game"}
    </button>
  );
}
