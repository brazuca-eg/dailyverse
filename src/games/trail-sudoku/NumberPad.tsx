import type { CSSProperties } from "react";
import { useArmedAction } from "../../hooks/useArmedAction";
import { sudokuMessages as t } from "./messages";
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
        aria-label={t("sudoku.pad.numbers")}
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
              aria-label={t("sudoku.pad.key", { digit, left: Math.max(left, 0) })}
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
          {isNotesMode ? t("sudoku.pad.notes.on") : t("sudoku.pad.notes.off")}
        </button>
        <button type="button" className="button button-secondary sudoku-action" onClick={onErase}>
          {t("sudoku.pad.erase")}
        </button>
        <button
          type="button"
          className="button button-secondary sudoku-action"
          disabled={!canUndo}
          onClick={onUndo}
        >
          {t("sudoku.pad.undo")}
        </button>
        <button type="button" className="button button-secondary sudoku-action" onClick={onCheck}>
          {t("sudoku.pad.check")}
        </button>
        <button type="button" className="button button-secondary sudoku-action" onClick={onHint}>
          {t("sudoku.pad.hint")}
        </button>
        <button
          type="button"
          className="button button-secondary sudoku-action"
          aria-pressed={giveUp.isArmed}
          onClick={giveUp.trigger}
        >
          {giveUp.isArmed ? t("sudoku.pad.tapAgain") : t("sudoku.pad.giveUp")}
        </button>
      </div>
    </div>
  );
}
