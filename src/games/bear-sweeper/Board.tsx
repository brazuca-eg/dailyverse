import { useRef, type KeyboardEvent, type MouseEvent, type PointerEvent } from "react";
import { FLAGGED, HIDDEN, REVEALED, TRIGGERED, type BearState } from "./game";
import { toCol, toRow } from "./grid";
import { PawIcon, PennantIcon } from "./Icons";
import { t } from "./messages";
import type { BearPuzzle } from "./types";
import "./Board.css";

interface BoardProps {
  puzzle: BearPuzzle;
  state: BearState;
  counts: readonly number[];
  revealBears: boolean;
  isActive: boolean;
  onPress: (index: number) => void;
  onFlag: (index: number) => void;
}

const LONG_PRESS_MS = 450;

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
  size: number,
  index: number,
  code: number,
  count: number,
  flags: { isBear: boolean; isWrongFlag: boolean },
): string {
  const place = t("bear.cell.place", {
    row: toRow(size, index) + 1,
    column: toCol(size, index) + 1,
  });
  if (code === TRIGGERED) {
    return t("bear.cell.bear", { place });
  }
  if (code === REVEALED) {
    return count === 0
      ? t("bear.cell.revealedEmpty", { place })
      : t("bear.cell.nearby", { place, count });
  }
  if (code === FLAGGED) {
    return t(flags.isWrongFlag ? "bear.cell.flaggedWrong" : "bear.cell.flagged", { place });
  }
  return t(flags.isBear ? "bear.cell.hiddenBear" : "bear.cell.hidden", { place });
}

export function Board({
  puzzle,
  state,
  counts,
  revealBears,
  isActive,
  onPress,
  onFlag,
}: BoardProps) {
  const { size } = puzzle;
  const cells = useRef<(HTMLButtonElement | null)[]>([]);
  const activeIndex = useRef(puzzle.start);
  const pressTimer = useRef<number | undefined>(undefined);
  const wasLongPress = useRef(false);
  const bears = new Set(puzzle.bears);

  function moveFocus(index: number, key: string) {
    const step = ARROW_STEPS[key];
    const row = Math.min(size - 1, Math.max(0, toRow(size, index) + step[0]));
    const col = Math.min(size - 1, Math.max(0, toCol(size, index) + step[1]));
    activeIndex.current = row * size + col;
    cells.current[activeIndex.current]?.focus();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTableElement>) {
    const index = readCellIndex(event.target);
    if (index === null || event.ctrlKey || event.metaKey || event.altKey) {
      return;
    }
    if (ARROW_STEPS[event.key]) {
      event.preventDefault();
      moveFocus(index, event.key);
    } else if ((event.key === "f" || event.key === "F") && isActive) {
      event.preventDefault();
      onFlag(index);
    }
  }

  function handlePointerDown(event: PointerEvent<HTMLTableElement>) {
    const index = readCellIndex(event.target);
    window.clearTimeout(pressTimer.current);
    wasLongPress.current = false;
    if (isActive && index !== null && event.pointerType !== "mouse") {
      pressTimer.current = window.setTimeout(() => {
        wasLongPress.current = true;
        onFlag(index);
      }, LONG_PRESS_MS);
    }
  }

  function cancelPress() {
    window.clearTimeout(pressTimer.current);
  }

  function handleClick(event: MouseEvent<HTMLTableElement>) {
    const index = readCellIndex(event.target);
    if (index === null) {
      return;
    }
    activeIndex.current = index;
    if (wasLongPress.current) {
      wasLongPress.current = false;
      return;
    }
    if (isActive) {
      onPress(index);
    }
  }

  function handleContextMenu(event: MouseEvent<HTMLTableElement>) {
    const index = readCellIndex(event.target);
    if (index !== null) {
      event.preventDefault();
      if (isActive) {
        onFlag(index);
      }
    }
  }

  return (
    <table
      className={`bs-board bs-${size}`}
      role="grid"
      aria-label={t("bear.board.label")}
      onKeyDown={handleKeyDown}
      onPointerDown={handlePointerDown}
      onPointerUp={cancelPress}
      onPointerLeave={cancelPress}
      onPointerCancel={cancelPress}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
    >
      <tbody>
        {Array.from({ length: size }, (_, row) => (
          <tr key={row}>
            {Array.from({ length: size }, (_, col) => {
              const index = row * size + col;
              const code = state.cells[index];
              const isBear = bears.has(index);
              const showBear = code === TRIGGERED || (revealBears && isBear && code !== TRIGGERED);
              const isWrongFlag = revealBears && code === FLAGGED && !isBear;
              const count = counts[index];
              const classes = [
                "bs-cell",
                code === REVEALED ? "bs-open" : "bs-grass",
                code === REVEALED && count > 0 ? `bs-n${Math.min(count, 3)}` : "",
                showBear ? "bs-bear" : "",
                isWrongFlag ? "bs-wrong" : "",
              ]
                .filter(Boolean)
                .join(" ");
              return (
                <td key={index} role="gridcell">
                  <button
                    type="button"
                    className={classes}
                    data-index={index}
                    tabIndex={index === puzzle.start ? 0 : -1}
                    ref={(element) => {
                      cells.current[index] = element;
                    }}
                    aria-label={describeCell(size, index, showBear ? TRIGGERED : code, count, {
                      isBear: revealBears && isBear,
                      isWrongFlag,
                    })}
                  >
                    {showBear && <PawIcon size={22} />}
                    {!showBear && code === FLAGGED && <PennantIcon size={22} />}
                    {!showBear && code === REVEALED && count > 0 && (
                      <span className="bs-number" aria-hidden="true">
                        {count}
                      </span>
                    )}
                    {isWrongFlag && (
                      <span className="bs-cross" aria-hidden="true">
                        ✗
                      </span>
                    )}
                    {code === HIDDEN && !showBear && (
                      <span className="bs-blades" aria-hidden="true" />
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
