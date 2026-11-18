export function toRow(size: number, index: number): number {
  return Math.floor(index / size);
}

export function toCol(size: number, index: number): number {
  return index % size;
}

export function listNeighbours(size: number, index: number): number[] {
  const row = toRow(size, index);
  const col = toCol(size, index);
  return [
    row > 0 ? index - size : -1,
    col < size - 1 ? index + 1 : -1,
    row < size - 1 ? index + size : -1,
    col > 0 ? index - 1 : -1,
  ].filter((neighbour) => neighbour >= 0);
}

export function areAdjacent(size: number, first: number, second: number): boolean {
  return listNeighbours(size, first).includes(second);
}

export function toEdgeKey(first: number, second: number): string {
  return first < second ? `${first}-${second}` : `${second}-${first}`;
}
