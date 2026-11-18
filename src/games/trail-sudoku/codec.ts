export function encodeGrid(grid: readonly number[]): string {
  return grid.join("");
}

export function decodeGrid(text: string): number[] {
  if (!/^[0-9]+$/.test(text)) {
    throw new Error(`"${text}" is not a grid of digits`);
  }
  return [...text].map(Number);
}
