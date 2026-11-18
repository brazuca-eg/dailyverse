import { LAYOUT_6, LAYOUT_9, type Layout } from "./layout";

export function readLayout(size: number): Layout {
  if (size === LAYOUT_6.size) {
    return LAYOUT_6;
  }
  if (size === LAYOUT_9.size) {
    return LAYOUT_9;
  }
  throw new Error(`There is no ${size}x${size} Trail Sudoku layout`);
}
