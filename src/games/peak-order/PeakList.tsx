import { useEffect, useRef, type DragEvent, type KeyboardEvent } from "react";
import { ArrowUpIcon, CheckIcon } from "../../ui/icons";
import { CATEGORIES } from "./categories";
import { formatValue } from "./format";
import type { PeakPuzzle } from "./puzzle";
import { ROUND_SIZE } from "./tiers";
import type { FocusRequest, FocusTarget } from "./usePeakSession";
import "./PeakList.css";

interface PeakListProps {
  puzzle: PeakPuzzle;
  order: readonly number[];
  confirmed: readonly boolean[];
  selected: number | null;
  isActive: boolean;
  isRevealed: boolean;
  focusRequest: FocusRequest | null;
  onPressRow: (position: number) => void;
  onShift: (position: number, delta: -1 | 1, target: FocusTarget) => void;
  onDrop: (from: number, to: number) => void;
  onDeselect: () => void;
}

function describeRow(
  puzzle: PeakPuzzle,
  item: number,
  position: number,
  isConfirmed: boolean,
  isRevealed: boolean,
): string {
  const { name, value } = puzzle.items[item];
  const parts = [`${name}, position ${position + 1} of ${ROUND_SIZE}`];
  if (isConfirmed) {
    parts.push("in the right place");
  }
  if (isRevealed) {
    parts.push(formatValue(value, puzzle.category));
  }
  return parts.join(", ");
}

export function PeakList({
  puzzle,
  order,
  confirmed,
  selected,
  isActive,
  isRevealed,
  focusRequest,
  onPressRow,
  onShift,
  onDrop,
  onDeselect,
}: PeakListProps) {
  const list = useRef<HTMLOListElement>(null);
  const dragSource = useRef<number | null>(null);
  const { lowest, highest } = CATEGORIES[puzzle.category];

  useEffect(() => {
    if (focusRequest === null) {
      return;
    }
    const row = list.current?.querySelector<HTMLElement>(`[data-item="${focusRequest.item}"]`);
    const wanted = row?.querySelector<HTMLButtonElement>(`[data-role="${focusRequest.target}"]`);
    const fallback = row?.querySelector<HTMLButtonElement>('[data-role="row"]');
    (wanted && !wanted.disabled ? wanted : fallback)?.focus();
  }, [focusRequest]);

  function handleRowKeyDown(event: KeyboardEvent, position: number) {
    if (event.key === "Escape") {
      onDeselect();
    } else if (selected === position && (event.key === "ArrowUp" || event.key === "ArrowDown")) {
      event.preventDefault();
      onShift(position, event.key === "ArrowUp" ? -1 : 1, "row");
    }
  }

  function handleDragStart(event: DragEvent, position: number) {
    dragSource.current = position;
    event.dataTransfer.setData("text/plain", String(position));
    event.dataTransfer.effectAllowed = "move";
  }

  function handleDrop(event: DragEvent, position: number) {
    event.preventDefault();
    const from = dragSource.current;
    dragSource.current = null;
    if (from !== null) {
      onDrop(from, position);
    }
  }

  return (
    <div className="peak-list-wrap">
      <p className="peak-end">{lowest}</p>
      <ol className="peak-list" ref={list} aria-label={`Your order, ${lowest} first`}>
        {order.map((item, position) => {
          const isConfirmed = confirmed[position];
          const isSelected = selected === position;
          const { name, value } = puzzle.items[item];
          const className = [
            "peak-row",
            isConfirmed ? "peak-row-confirmed" : "",
            isSelected ? "peak-row-selected" : "",
            isRevealed ? "peak-row-revealed" : "",
          ]
            .filter(Boolean)
            .join(" ");
          return (
            <li
              key={item}
              className={className}
              data-item={item}
              draggable={isActive}
              onDragStart={(event) => handleDragStart(event, position)}
              onDragOver={(event) => isActive && event.preventDefault()}
              onDrop={(event) => isActive && handleDrop(event, position)}
            >
              {isActive ? (
                <button
                  type="button"
                  className="peak-main"
                  data-role="row"
                  aria-pressed={isSelected}
                  aria-label={describeRow(puzzle, item, position, isConfirmed, isRevealed)}
                  onClick={() => onPressRow(position)}
                  onKeyDown={(event) => handleRowKeyDown(event, position)}
                >
                  <span className="peak-rank" aria-hidden="true">
                    {position + 1}
                  </span>
                  <span className="peak-name" aria-hidden="true">
                    {name}
                  </span>
                  {isConfirmed && (
                    <span className="peak-badge" aria-hidden="true">
                      <CheckIcon size={16} /> In place
                    </span>
                  )}
                </button>
              ) : (
                <div
                  className="peak-main"
                  role="group"
                  aria-label={describeRow(puzzle, item, position, isConfirmed, isRevealed)}
                >
                  <span className="peak-rank" aria-hidden="true">
                    {position + 1}
                  </span>
                  <span className="peak-name" aria-hidden="true">
                    {name}
                  </span>
                  {isRevealed && (
                    <span className="peak-value" aria-hidden="true">
                      {formatValue(value, puzzle.category)}
                    </span>
                  )}
                </div>
              )}
              {isActive && (
                <div className="peak-move">
                  <button
                    type="button"
                    className="icon-button peak-shift"
                    data-role="up"
                    aria-label={`Move ${name} up`}
                    disabled={position === 0}
                    onClick={() => onShift(position, -1, "up")}
                  >
                    <ArrowUpIcon size={20} />
                  </button>
                  <button
                    type="button"
                    className="icon-button peak-shift peak-shift-down"
                    data-role="down"
                    aria-label={`Move ${name} down`}
                    disabled={position === ROUND_SIZE - 1}
                    onClick={() => onShift(position, 1, "down")}
                  >
                    <ArrowUpIcon size={20} />
                  </button>
                </div>
              )}
            </li>
          );
        })}
      </ol>
      <p className="peak-end">{highest}</p>
    </div>
  );
}
