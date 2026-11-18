import { buildUnits, countBits, listDigits, toBit, type Layout } from "./layout";
import { computeCandidates, readPeers } from "./solver";

export const LEVEL_NAKED = 1;
export const LEVEL_HIDDEN = 2;
export const LEVEL_SUBSETS = 3;
export const LEVEL_ADVANCED = 4;

export interface LogicResult {
  solved: boolean;
  hardest: number;
  grid: number[];
}

export interface Board {
  layout: Layout;
  grid: number[];
  cand: number[];
  units: number[][];
  peers: number[][];
}

const unitsByKey = new Map<string, number[][]>();

function readUnits(layout: Layout): number[][] {
  const key = `${layout.size}:${layout.boxRows}:${layout.boxCols}`;
  const known = unitsByKey.get(key);
  if (known) {
    return known;
  }
  const units = buildUnits(layout);
  unitsByKey.set(key, units);
  return units;
}

function place(board: Board, index: number, digit: number): void {
  board.grid[index] = digit;
  board.cand[index] = toBit(digit);
  board.peers[index].forEach((peer) => {
    board.cand[peer] &= ~toBit(digit);
  });
}

function strip(board: Board, index: number, mask: number): boolean {
  const next = board.cand[index] & ~mask;
  const changed = next !== board.cand[index];
  board.cand[index] = next;
  return changed;
}

function listEmpty(board: Board, unit: readonly number[]): number[] {
  return unit.filter((index) => board.grid[index] === 0);
}

function applyNakedSingles(board: Board): boolean {
  const cells = board.grid
    .map((digit, index) => index)
    .filter((index) => board.grid[index] === 0 && countBits(board.cand[index]) === 1);
  cells.forEach((index) => {
    if (board.grid[index] === 0 && countBits(board.cand[index]) === 1) {
      place(board, index, listDigits(board.cand[index])[0]);
    }
  });
  return cells.length > 0;
}

function applyHiddenSingles(board: Board): boolean {
  const found: { index: number; digit: number }[] = [];
  board.units.forEach((unit) => {
    const empty = listEmpty(board, unit);
    Array.from({ length: board.layout.size }, (_, bit) => bit + 1).forEach((digit) => {
      const spots = empty.filter((index) => (board.cand[index] & toBit(digit)) !== 0);
      if (spots.length === 1) {
        found.push({ index: spots[0], digit });
      }
    });
  });
  found.forEach(({ index, digit }) => {
    if (board.grid[index] === 0 && (board.cand[index] & toBit(digit)) !== 0) {
      place(board, index, digit);
    }
  });
  return found.length > 0;
}

function applyLocked(board: Board): boolean {
  const { size } = board.layout;
  const lines = board.units.slice(0, 2 * size);
  const boxes = board.units.slice(2 * size);
  let changed = false;
  lines.forEach((line) => {
    boxes.forEach((box) => {
      Array.from({ length: size }, (_, bit) => bit + 1).forEach((digit) => {
        const bit = toBit(digit);
        const inLine = listEmpty(board, line).filter((index) => (board.cand[index] & bit) !== 0);
        const inBox = listEmpty(board, box).filter((index) => (board.cand[index] & bit) !== 0);
        const claiming = inLine.length > 0 && inLine.every((index) => box.includes(index));
        const pointing = inBox.length > 0 && inBox.every((index) => line.includes(index));
        if (claiming) {
          inBox
            .filter((index) => !line.includes(index))
            .forEach((index) => {
              changed = strip(board, index, bit) || changed;
            });
        }
        if (pointing) {
          inLine
            .filter((index) => !box.includes(index))
            .forEach((index) => {
              changed = strip(board, index, bit) || changed;
            });
        }
      });
    });
  });
  return changed;
}

function listCombinations<T>(items: readonly T[], size: number): T[][] {
  if (size === 0) {
    return [[]];
  }
  return items.flatMap((item, position) =>
    listCombinations(items.slice(position + 1), size - 1).map((rest) => [item, ...rest]),
  );
}

function applyNakedSubsets(board: Board, size: number): boolean {
  let changed = false;
  board.units.forEach((unit) => {
    const empty = listEmpty(board, unit).filter((index) => countBits(board.cand[index]) <= size);
    listCombinations(empty, size).forEach((group) => {
      const union = group.reduce((mask, index) => mask | board.cand[index], 0);
      if (countBits(union) === size) {
        listEmpty(board, unit)
          .filter((index) => !group.includes(index))
          .forEach((index) => {
            changed = strip(board, index, union) || changed;
          });
      }
    });
  });
  return changed;
}

function applyHiddenPairs(board: Board): boolean {
  let changed = false;
  const digits = Array.from({ length: board.layout.size }, (_, bit) => bit + 1);
  board.units.forEach((unit) => {
    const empty = listEmpty(board, unit);
    const spotsOf = (digit: number) =>
      empty.filter((index) => (board.cand[index] & toBit(digit)) !== 0);
    const pairable = digits.filter((digit) => spotsOf(digit).length === 2);
    listCombinations(pairable, 2).forEach(([first, second]) => {
      const spots = spotsOf(first);
      const same = spots.every((index) => spotsOf(second).includes(index));
      if (same) {
        const keep = toBit(first) | toBit(second);
        spots.forEach((index) => {
          changed = strip(board, index, board.cand[index] & ~keep) || changed;
        });
      }
    });
  });
  return changed;
}

function applyNakedPairs(board: Board): boolean {
  return applyNakedSubsets(board, 2);
}

export interface Technique {
  name: string;
  level: number;
  apply: (board: Board) => boolean;
}

export const TECHNIQUES: readonly Technique[] = [
  { name: "naked-single", level: LEVEL_NAKED, apply: applyNakedSingles },
  { name: "hidden-single", level: LEVEL_HIDDEN, apply: applyHiddenSingles },
  { name: "locked-candidates", level: LEVEL_SUBSETS, apply: applyLocked },
  { name: "naked-pair", level: LEVEL_SUBSETS, apply: applyNakedPairs },
  { name: "hidden-pair", level: LEVEL_ADVANCED, apply: applyHiddenPairs },
  { name: "naked-triple", level: LEVEL_ADVANCED, apply: (board) => applyNakedSubsets(board, 3) },
];

export function solveByLogic(
  layout: Layout,
  grid: readonly number[],
  maxLevel = LEVEL_ADVANCED,
  techniques: readonly Technique[] = TECHNIQUES,
): LogicResult {
  const cand = computeCandidates(layout, grid);
  if (cand === null) {
    return { solved: false, hardest: 0, grid: [...grid] };
  }
  const board: Board = {
    layout,
    grid: [...grid],
    cand,
    units: readUnits(layout),
    peers: readPeers(layout),
  };
  let hardest = 0;
  let progressed = true;
  while (progressed && board.grid.some((digit) => digit === 0)) {
    const step = techniques
      .filter((technique) => technique.level <= maxLevel)
      .find((technique) => technique.apply(board));
    progressed = step !== undefined;
    hardest = Math.max(hardest, step?.level ?? 0);
  }
  const solved = board.grid.every((digit) => digit !== 0) && board.cand.every((mask) => mask !== 0);
  return { solved, hardest, grid: board.grid };
}
