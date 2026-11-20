import { useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from "react";
import { GRASS, TENT, type Analysis, type LineStatus } from "./game";
import { GrassPiece, TentPiece, TreePiece } from "./Pieces";
import { toIndex } from "./rules";
import { tentsMessages } from "./messages";
import type { TentsPuzzle } from "./types";
import "./Board.css";

interface BoardProps {
  puzzle: TentsPuzzle;
  marks: readonly number[];
  analysis: Analysis;
  revealSolution: boolean;
  onCycle: (index: number) => void;
  onPaint: (indexes: number[]) => void;
  onUndo: () => void;
}

interface Drag {
  start: number;
  last: number;
  isDragging: boolean;
}

const LINE_SYMBOLS: Readonly<Record<LineStatus, string>> = { under: "", met: "✓", over: "!" };

function describeLine(status: LineStatus): string {
  return tentsMessages(`tents.line.status.${status}`);
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

function findIndexAtPoint(x: number, y: number): number | null {
  return readCellIndex(document.elementFromPoint(x, y));
}

type CellKind = "tree" | "tent" | "grass" | "empty";

function readCellKind(isTree: boolean, mark: number): CellKind {
  if (isTree) {
    return "tree";
  }
  if (mark === TENT) {
    return "tent";
  }
  return mark === GRASS ? "grass" : "empty";
}

function describeCell(kind: CellKind, isAnswer: boolean, isClash: boolean): string {
  const base = isAnswer ? tentsMessages("tents.cell.answer") : tentsMessages(`tents.cell.${kind}`);
  return isClash ? tentsMessages("tents.cell.conflict", { base }) : base;
}

function LineHeader({
  label,
  target,
  status,
  scope,
}: {
  label: string;
  target: number;
  status: LineStatus;
  scope: "row" | "col";
}) {
  return (
    <th
      scope={scope}
      className={`line line-${status}`}
      aria-label={tentsMessages("tents.line.label", {
        label,
        count: target,
        status: describeLine(status),
      })}
    >
      <span aria-hidden="true">
        {target}
        {LINE_SYMBOLS[status]}
      </span>
    </th>
  );
}

export function Board({
  puzzle,
  marks,
  analysis,
  revealSolution,
  onCycle,
  onPaint,
  onUndo,
}: BoardProps) {
  const { size } = puzzle;
  const [activeIndex, setActiveIndex] = useState(0);
  const cells = useRef<(HTMLButtonElement | null)[]>([]);
  const drag = useRef<Drag | null>(null);
  const treeIndexes = new Set(puzzle.trees.map((tree) => toIndex(size, tree)));
  const answerIndexes = new Set(puzzle.solution.map((tent) => toIndex(size, tent)));
  const clashing = new Set(analysis.clashing);

  function moveFocus(index: number, key: string) {
    const step = ARROW_STEPS[key];
    const row = Math.min(size - 1, Math.max(0, Math.floor(index / size) + step[0]));
    const col = Math.min(size - 1, Math.max(0, (index % size) + step[1]));
    const next = row * size + col;
    setActiveIndex(next);
    cells.current[next]?.focus();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTableElement>) {
    const index = readCellIndex(event.target);
    if (index === null) {
      return;
    }
    if (ARROW_STEPS[event.key]) {
      event.preventDefault();
      moveFocus(index, event.key);
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onCycle(index);
    } else if (event.key === "g" || event.key === "G") {
      event.preventDefault();
      onPaint([index]);
    } else if (event.key === "Backspace") {
      event.preventDefault();
      onUndo();
    }
  }

  function handlePointerDown(event: PointerEvent<HTMLTableElement>) {
    const index = readCellIndex(event.target);
    if (index !== null && event.button === 0) {
      drag.current = { start: index, last: index, isDragging: false };
      setActiveIndex(index);
    }
  }

  function handlePointerMove(event: PointerEvent<HTMLTableElement>) {
    const current = drag.current;
    if (!current) {
      return;
    }
    const index = findIndexAtPoint(event.clientX, event.clientY);
    if (index === null || index === current.last) {
      return;
    }
    onPaint(current.isDragging ? [index] : [current.start, index]);
    drag.current = { ...current, last: index, isDragging: true };
  }

  function handlePointerUp() {
    const current = drag.current;
    drag.current = null;
    if (current && !current.isDragging) {
      onCycle(current.start);
    }
  }

  return (
    <table
      className="board"
      role="grid"
      aria-label={tentsMessages("tents.board.label", { size })}
      style={{ "--size": size } as CSSProperties}
      onKeyDown={handleKeyDown}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={() => {
        drag.current = null;
      }}
    >
      <thead>
        <tr>
          <td className="corner" />
          {puzzle.colCounts.map((target, col) => (
            <LineHeader
              key={col}
              scope="col"
              label={tentsMessages("tents.line.col", { n: col + 1 })}
              target={target}
              status={analysis.cols[col]}
            />
          ))}
        </tr>
      </thead>
      <tbody>
        {puzzle.rowCounts.map((target, row) => (
          <tr key={row}>
            <LineHeader
              scope="row"
              label={tentsMessages("tents.line.row", { n: row + 1 })}
              target={target}
              status={analysis.rows[row]}
            />
            {Array.from({ length: size }, (_, col) => {
              const index = row * size + col;
              const isTree = treeIndexes.has(index);
              const isAnswer = revealSolution && answerIndexes.has(index) && marks[index] !== TENT;
              const kind = readCellKind(isTree, marks[index]);
              const isClash = clashing.has(index);
              return (
                <td key={col} role="gridcell">
                  <button
                    type="button"
                    ref={(element) => {
                      cells.current[index] = element;
                    }}
                    data-index={index}
                    tabIndex={index === activeIndex ? 0 : -1}
                    className={[
                      "cell",
                      `cell-${kind}`,
                      isClash ? "cell-clash" : "",
                      isAnswer ? "cell-answer" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    aria-disabled={isTree || undefined}
                    aria-label={tentsMessages("tents.cell.label", {
                      row: row + 1,
                      col: col + 1,
                      description: describeCell(kind, isAnswer, isClash),
                    })}
                  >
                    {isTree && <TreePiece />}
                    {!isTree && (marks[index] === TENT || isAnswer) && <TentPiece />}
                    {!isTree && marks[index] === GRASS && <GrassPiece />}
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
