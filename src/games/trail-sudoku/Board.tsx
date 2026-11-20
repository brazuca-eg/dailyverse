import { useRef, type KeyboardEvent } from "react";
import { listDigits, findBox } from "./layout";
import { readLayout } from "./readLayout";
import type { SudokuState } from "./game";
import { sudokuMessages as t } from "./messages";
import type { SudokuPuzzle } from "./types";
import "./Board.css";

interface BoardProps {
  puzzle: SudokuPuzzle;
  state: SudokuState;
  values: readonly number[];
  conflicts: ReadonlySet<number>;
  selected: number | null;
  revealSolution: boolean;
  onSelect: (index: number) => void;
  onDigit: (digit: number) => void;
  onErase: () => void;
  onUndo: () => void;
  onToggleNotes: () => void;
}

const ARROW_STEPS: Readonly<Record<string, readonly [number, number]>> = {
  ArrowLeft: [0, -1],
  ArrowRight: [0, 1],
  ArrowUp: [-1, 0],
  ArrowDown: [1, 0],
};

function readCellIndex(target: EventTarget | null): number | null {
  const cell = target instanceof Element ? target.closest<HTMLElement>("[data-index]") : null;
  return cell ? Number(cell.dataset.index) : null;
}

function describeCell(
  index: number,
  size: number,
  given: number,
  value: number,
  notes: number,
  flags: { isConflict: boolean; isFlagged: boolean },
): string {
  const place = t("sudoku.cell.place", {
    row: Math.floor(index / size) + 1,
    col: (index % size) + 1,
  });
  let what = t("sudoku.cell.empty");
  if (given !== 0) {
    what = t("sudoku.cell.given", { digit: given });
  } else if (value !== 0) {
    what = t("sudoku.cell.entered", { digit: value });
  } else if (notes !== 0) {
    what = t("sudoku.cell.notes", { digits: listDigits(notes).join(" ") });
  }
  const marks = [
    flags.isConflict ? t("sudoku.cell.clash") : "",
    flags.isFlagged ? t("sudoku.cell.wrong") : "",
  ].filter(Boolean);
  return [place, what, ...marks].join(", ");
}

export function Board({
  puzzle,
  state,
  values,
  conflicts,
  selected,
  revealSolution,
  onSelect,
  onDigit,
  onErase,
  onUndo,
  onToggleNotes,
}: BoardProps) {
  const { size } = puzzle;
  const layout = readLayout(size);
  const cells = useRef<(HTMLButtonElement | null)[]>([]);
  const flagged = new Set(state.flagged);
  const active = selected ?? 0;
  const selectedValue = selected === null ? 0 : values[selected];
  const selectedBox = selected === null ? -1 : findBox(layout, selected);
  const selectedRow = selected === null ? -1 : Math.floor(selected / size);
  const selectedCol = selected === null ? -1 : selected % size;

  function moveFocus(index: number, key: string) {
    const step = ARROW_STEPS[key];
    const row = Math.min(size - 1, Math.max(0, Math.floor(index / size) + step[0]));
    const col = Math.min(size - 1, Math.max(0, (index % size) + step[1]));
    const next = row * size + col;
    onSelect(next);
    cells.current[next]?.focus();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTableElement>) {
    const index = readCellIndex(event.target);
    if (index === null || event.ctrlKey || event.metaKey || event.altKey) {
      return;
    }
    const digit = Number(event.key);
    if (ARROW_STEPS[event.key]) {
      event.preventDefault();
      moveFocus(index, event.key);
    } else if (Number.isInteger(digit) && digit >= 1 && digit <= size) {
      event.preventDefault();
      onDigit(digit);
    } else if (event.key === "Backspace" || event.key === "Delete" || event.key === "0") {
      event.preventDefault();
      onErase();
    } else if (event.key === "n" || event.key === "N") {
      event.preventDefault();
      onToggleNotes();
    } else if (event.key === "u" || event.key === "U") {
      event.preventDefault();
      onUndo();
    }
  }

  return (
    <table
      className={`sudoku-board sudoku-${size}`}
      role="grid"
      aria-label={t("sudoku.board.label")}
      onKeyDown={handleKeyDown}
    >
      <tbody>
        {Array.from({ length: size }, (_, row) => (
          <tr key={row}>
            {Array.from({ length: size }, (_, col) => {
              const index = row * size + col;
              const given = puzzle.givens[index];
              const value = values[index];
              const isAnswer =
                revealSolution && given === 0 && state.entries[index] !== puzzle.solution[index];
              const shown = isAnswer ? puzzle.solution[index] : value;
              const isConflict = conflicts.has(index);
              const isFlagged = flagged.has(index);
              const classes = [
                "sudoku-cell",
                given !== 0 ? "sudoku-given" : "",
                row % layout.boxRows === 0 && row > 0 ? "sudoku-box-top" : "",
                col % layout.boxCols === 0 && col > 0 ? "sudoku-box-left" : "",
                selected === index ? "sudoku-selected" : "",
                selected !== null &&
                selected !== index &&
                (row === selectedRow ||
                  col === selectedCol ||
                  findBox(layout, index) === selectedBox)
                  ? "sudoku-peer"
                  : "",
                selectedValue !== 0 && value === selectedValue && selected !== index
                  ? "sudoku-same"
                  : "",
                isConflict ? "sudoku-conflict" : "",
                isFlagged ? "sudoku-flagged" : "",
                isAnswer ? "sudoku-answer" : "",
              ]
                .filter(Boolean)
                .join(" ");
              const noteDigits = shown === 0 ? listDigits(state.notes[index]) : [];
              return (
                <td key={index} role="gridcell">
                  <button
                    type="button"
                    className={classes}
                    data-index={index}
                    tabIndex={index === active ? 0 : -1}
                    ref={(element) => {
                      cells.current[index] = element;
                    }}
                    aria-label={describeCell(
                      index,
                      size,
                      given,
                      isAnswer ? 0 : value,
                      state.notes[index],
                      {
                        isConflict,
                        isFlagged,
                      },
                    )}
                    aria-current={selected === index ? "true" : undefined}
                    onClick={() => onSelect(index)}
                    onFocus={() => onSelect(index)}
                  >
                    {shown !== 0 ? (
                      <span className="sudoku-digit" aria-hidden="true">
                        {shown}
                      </span>
                    ) : (
                      <span className="sudoku-notes" aria-hidden="true">
                        {Array.from({ length: size }, (_, bit) => (
                          <span key={bit}>{noteDigits.includes(bit + 1) ? bit + 1 : ""}</span>
                        ))}
                      </span>
                    )}
                    {isFlagged && (
                      <span className="sudoku-mark" aria-hidden="true">
                        ✗
                      </span>
                    )}
                  </button>
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
