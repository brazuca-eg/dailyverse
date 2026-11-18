export interface Layout {
  size: number;
  boxRows: number;
  boxCols: number;
}

export const LAYOUT_6: Layout = { size: 6, boxRows: 2, boxCols: 3 };
export const LAYOUT_9: Layout = { size: 9, boxRows: 3, boxCols: 3 };

export interface Cell {
  row: number;
  col: number;
}

export function toCell(layout: Layout, index: number): Cell {
  return { row: Math.floor(index / layout.size), col: index % layout.size };
}

export function toIndex(layout: Layout, cell: Cell): number {
  return cell.row * layout.size + cell.col;
}

export function findBox(layout: Layout, index: number): number {
  const { row, col } = toCell(layout, index);
  const boxesPerRow = layout.size / layout.boxCols;
  return Math.floor(row / layout.boxRows) * boxesPerRow + Math.floor(col / layout.boxCols);
}

function listIndexes(layout: Layout): number[] {
  return Array.from({ length: layout.size * layout.size }, (_, index) => index);
}

export function buildUnits(layout: Layout): number[][] {
  const indexes = listIndexes(layout);
  const rows = Array.from({ length: layout.size }, (_, row) =>
    indexes.filter((index) => toCell(layout, index).row === row),
  );
  const cols = Array.from({ length: layout.size }, (_, col) =>
    indexes.filter((index) => toCell(layout, index).col === col),
  );
  const boxes = Array.from({ length: layout.size }, (_, box) =>
    indexes.filter((index) => findBox(layout, index) === box),
  );
  return [...rows, ...cols, ...boxes];
}

export function buildPeers(layout: Layout): number[][] {
  const indexes = listIndexes(layout);
  return indexes.map((index) => {
    const { row, col } = toCell(layout, index);
    const box = findBox(layout, index);
    return indexes.filter((other) => {
      const near = toCell(layout, other);
      return (
        other !== index && (near.row === row || near.col === col || findBox(layout, other) === box)
      );
    });
  });
}

export function fullMask(layout: Layout): number {
  return (1 << layout.size) - 1;
}

export function toBit(digit: number): number {
  return 1 << (digit - 1);
}

export function listDigits(mask: number): number[] {
  return Array.from({ length: 31 }, (_, bit) => bit + 1).filter(
    (digit) => (mask & toBit(digit)) !== 0,
  );
}

export function countBits(mask: number): number {
  return listDigits(mask).length;
}
