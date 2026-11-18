import type { CategoryId } from "./categories";
import type { PeakTier } from "./tiers";

export type StoredItem = [name: string, value: number, editions: number];

export interface CategoryData {
  items: StoredItem[];
  medium: number[][];
  hard: number[][];
  minEditions: Record<PeakTier, number>;
}

export type PeakData = Record<CategoryId, CategoryData>;
