import type { CSSProperties } from "react";
import { useArmedAction } from "../../hooks/useArmedAction";
import "./NumberPad.css";

interface NumberPadProps {
  size: number;
  counts: readonly number[];
  isNotesMode: boolean;
  canUndo: boolean;
  onDigit: (digit: number) => void;
  onErase: () => void;
  onUndo: () => void;
  onToggleNotes: () => void;
  onCheck: () => void;
  onHint: () => void;
  onGiveUp: () => void;
}

export function NumberPad({
  size,
  counts,
  isNotesMode,
  canUndo,
  onDigit,
  onErase,
  onUndo,
  onToggleNotes,
  onCheck,
  onHint,
  onGiveUp,
}: NumberPadProps) {
  const giveUp = useArmedAction(onGiveUp);
  return (
    <div className="sudoku-pad">
      <div
        className="sudoku-digits"
        role="group"
        aria-label="Numbers"
        style={{ "--keys": size } as CSSProperties}
      >
        {Array.from({ length: size }, (_, index) => {
          const digit = index + 1;
          const left = size - counts[digit - 1];
          return (
            <button
              key={digit}
              type="button"
              className="button button-secondary sudoku-digit-key"
              disabled={left <= 0}
              aria-label={`${digit}, ${Math.max(left, 0)} left`}
              onClick={() => onDigit(digit)}
            >
              <span aria-hidden="true">{digit}</span>
              <span className="sudoku-left" aria-hidden="true">
                {Math.max(left, 0)}
              </span>
            </button>
          );
        })}
      </div>
      <div className="sudoku-actions">
        <button
          type="button"
          className="button button-secondary sudoku-action"
          aria-pressed={isNotesMode}
          onClick={onToggleNotes}
        >
          Notes {isNotesMode ? "on" : "off"}
        </button>
        <button type="button" className="button button-secondary sudoku-action" onClick={onErase}>
          Erase
        </button>
        <button
          type="button"
          className="button button-secondary sudoku-action"
          disabled={!canUndo}
          onClick={onUndo}
        >
          Undo
        </button>
        <button type="button" className="button button-secondary sudoku-action" onClick={onCheck}>
          Check
        </button>
        <button type="button" className="button button-secondary sudoku-action" onClick={onHint}>
          Hint
        </button>
        <button
          type="button"
          className="button button-secondary sudoku-action"
          aria-pressed={giveUp.isArmed}
          onClick={giveUp.trigger}
        >
          {giveUp.isArmed ? "Tap again" : "Give up"}
        </button>
      </div>
    </div>
  );
}
