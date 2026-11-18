import {
  useEffect,
  useRef,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
} from "react";
import { countReachedMarks } from "./game";
import { toCol, toRow } from "./grid";
import type { SwitchbackPuzzle, Wall } from "./types";
import type { Direction } from "./useSwitchbackSession";
import "./Board.css";

interface BoardProps {
  puzzle: SwitchbackPuzzle;
  path: readonly number[];
  solution: readonly number[];
  revealSolution: boolean;
  isActive: boolean;
  onMove: (cell: number) => void;
  onStep: (direction: Direction) => void;
  onUndo: () => void;
  onReset: () => void;
}

const ARROW_DIRECTIONS: Readonly<Record<string, Direction>> = {
  ArrowUp: "up",
  ArrowRight: "right",
  ArrowDown: "down",
  ArrowLeft: "left",
};

function readCellIndex(target: EventTarget | null): number | null {
  const cell = target instanceof Element ? target.closest<HTMLElement>("[data-index]") : null;
  return cell ? Number(cell.dataset.index) : null;
}

function findIndexAtPoint(x: number, y: number): number | null {
  return readCellIndex(document.elementFromPoint(x, y));
}

function toPoints(size: number, cells: readonly number[]): string {
  return cells.map((cell) => `${toCol(size, cell) + 0.5},${toRow(size, cell) + 0.5}`).join(" ");
}

function describeFences(puzzle: SwitchbackPuzzle, cell: number): string[] {
  const { size } = puzzle;
  const sides: [number, string][] = [
    [cell - size, "above"],
    [cell + 1, "right"],
    [cell + size, "below"],
    [cell - 1, "left"],
  ];
  return sides
    .filter(([other]) =>
      puzzle.walls.some(([a, b]) => (a === cell && b === other) || (b === cell && a === other)),
    )
    .map(([, side]) => `fence ${side}`);
}

function describeCell(puzzle: SwitchbackPuzzle, path: readonly number[], cell: number): string {
  const { size } = puzzle;
  const mark = puzzle.marks.indexOf(cell);
  const parts = [`Row ${toRow(size, cell) + 1}, column ${toCol(size, cell) + 1}`];
  if (mark !== -1) {
    parts.push(`checkpoint ${mark + 1}`);
  }
  if (cell === path[path.length - 1]) {
    parts.push("end of your trail");
  } else if (path.includes(cell)) {
    parts.push("on your trail");
  } else {
    parts.push("empty");
  }
  return [...parts, ...describeFences(puzzle, cell)].join(", ");
}

function WallLine({ size, wall }: { size: number; wall: Wall }) {
  const [first, second] = wall[0] < wall[1] ? wall : [wall[1], wall[0]];
  const isHorizontalPair = second === first + 1;
  const row = toRow(size, second);
  const col = toCol(size, second);
  const line = isHorizontalPair
    ? { x1: col, y1: row, x2: col, y2: row + 1 }
    : { x1: col, y1: row, x2: col + 1, y2: row };
  return (
    <g className="sw-fence">
      <line {...line} />
      <circle cx={line.x1} cy={line.y1} r={0.07} />
      <circle cx={line.x2} cy={line.y2} r={0.07} />
    </g>
  );
}

export function Board({
  puzzle,
  path,
  solution,
  revealSolution,
  isActive,
  onMove,
  onStep,
  onUndo,
  onReset,
}: BoardProps) {
  const { size } = puzzle;
  const cells = useRef<(HTMLButtonElement | null)[]>([]);
  const isDragging = useRef(false);
  const lastDragged = useRef<number | null>(null);
  const wantsFocus = useRef(false);
  const head = path[path.length - 1];
  const reached = countReachedMarks(puzzle, path);
  const onTrail = new Set(path);

  useEffect(() => {
    if (wantsFocus.current) {
      wantsFocus.current = false;
      cells.current[head]?.focus();
    }
  }, [head]);

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (!isActive || event.ctrlKey || event.metaKey || event.altKey) {
      return;
    }
    const direction = ARROW_DIRECTIONS[event.key];
    if (direction) {
      event.preventDefault();
      wantsFocus.current = true;
      onStep(direction);
    } else if (event.key === "Backspace" || event.key === "Delete") {
      event.preventDefault();
      wantsFocus.current = true;
      onUndo();
    } else if (event.key === "r" || event.key === "R") {
      event.preventDefault();
      wantsFocus.current = true;
      onReset();
    }
  }

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    const index = readCellIndex(event.target);
    if (!isActive || index === null || event.button !== 0) {
      return;
    }
    isDragging.current = true;
    lastDragged.current = index;
    onMove(index);
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!isDragging.current) {
      return;
    }
    const index = findIndexAtPoint(event.clientX, event.clientY);
    if (index !== null && index !== lastDragged.current) {
      lastDragged.current = index;
      onMove(index);
    }
  }

  function endDrag() {
    isDragging.current = false;
    lastDragged.current = null;
  }

  return (
    <div
      className="sw-board"
      role="group"
      aria-label="Switchback board"
      style={{ "--size": size } as CSSProperties}
      onKeyDown={handleKeyDown}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onPointerLeave={endDrag}
    >
      <div className="sw-grid">
        {Array.from({ length: size * size }, (_, cell) => {
          const mark = puzzle.marks.indexOf(cell);
          const isNext = mark === reached;
          const classes = [
            "sw-cell",
            onTrail.has(cell) ? "sw-visited" : "",
            mark !== -1 && mark < reached ? "sw-reached" : "",
            isNext ? "sw-next" : "",
          ]
            .filter(Boolean)
            .join(" ");
          return (
            <button
              key={cell}
              type="button"
              className={classes}
              data-index={cell}
              disabled={!isActive}
              tabIndex={cell === head ? 0 : -1}
              ref={(element) => {
                cells.current[cell] = element;
              }}
              aria-label={describeCell(puzzle, path, cell)}
              onClick={(event) => {
                if (event.detail === 0) {
                  onMove(cell);
                }
              }}
            >
              {mark !== -1 && (
                <span className="sw-badge" aria-hidden="true">
                  {mark + 1}
                </span>
              )}
            </button>
          );
        })}
      </div>
      <svg className="sw-overlay" viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        {revealSolution && <polyline className="sw-answer" points={toPoints(size, solution)} />}
        <polyline className="sw-trail" points={toPoints(size, path)} />
        <polyline className="sw-trail-dash" points={toPoints(size, path)} />
        {puzzle.walls.map((wall) => (
          <WallLine key={`${wall[0]}-${wall[1]}`} size={size} wall={wall} />
        ))}
        <circle
          className="sw-head"
          cx={toCol(size, head) + 0.5}
          cy={toRow(size, head) + 0.5}
          r={0.2}
        />
      </svg>
    </div>
  );
}
