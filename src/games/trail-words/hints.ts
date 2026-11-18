import type { TrailPuzzle } from "./puzzle";
import { toLetterMask } from "./words";

export interface HintGrid {
  letters: string[];
  lengths: number[];
  counts: number[][];
  rowTotals: number[];
  columnTotals: number[];
  total: number;
  pangramsLeft: number;
}

export function buildHints(puzzle: TrailPuzzle, found: ReadonlySet<string>): HintGrid {
  const left = [...puzzle.common].filter((word) => !found.has(word));
  const letters = [...new Set(left.map((word) => word[0]))].sort();
  const lengths = [...new Set(left.map((word) => word.length))].sort((a, b) => a - b);
  const counts = letters.map((letter) =>
    lengths.map(
      (length) => left.filter((word) => word[0] === letter && word.length === length).length,
    ),
  );
  return {
    letters,
    lengths,
    counts,
    rowTotals: counts.map((row) => row.reduce((total, count) => total + count, 0)),
    columnTotals: lengths.map((_, column) => counts.reduce((total, row) => total + row[column], 0)),
    total: left.length,
    pangramsLeft: left.filter((word) => toLetterMask(word) === puzzle.letterMask).length,
  };
}
