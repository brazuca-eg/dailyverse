export function toRow(size: number, index: number): number {
  return Math.floor(index / size);
}

export function toCol(size: number, index: number): number {
  return index % size;
}

export function listNeighbours(size: number, index: number): number[] {
  const row = toRow(size, index);
  const col = toCol(size, index);
  const neighbours: number[] = [];
  for (let rowStep = -1; rowStep <= 1; rowStep += 1) {
    for (let colStep = -1; colStep <= 1; colStep += 1) {
      const nextRow = row + rowStep;
      const nextCol = col + colStep;
      const isInside = nextRow >= 0 && nextRow < size && nextCol >= 0 && nextCol < size;
      if (isInside && (rowStep !== 0 || colStep !== 0)) {
        neighbours.push(nextRow * size + nextCol);
      }
    }
  }
  return neighbours;
}

const neighbourCache = new Map<number, number[][]>();

export function readNeighbours(size: number): number[][] {
  const known = neighbourCache.get(size);
  if (known) {
    return known;
  }
  const all = Array.from({ length: size * size }, (_, index) => listNeighbours(size, index));
  neighbourCache.set(size, all);
  return all;
}
