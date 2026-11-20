export const CATEGORY_IDS = ["mountains", "rivers", "lakes", "islands", "volcanoes"] as const;

export type CategoryId = (typeof CATEGORY_IDS)[number];

export interface CategoryInfo {
  id: CategoryId;
  minValue: number;
}

export const CATEGORIES: Record<CategoryId, CategoryInfo> = {
  mountains: {
    id: "mountains",
    minValue: 300,
  },
  rivers: {
    id: "rivers",
    minValue: 30,
  },
  lakes: {
    id: "lakes",
    minValue: 50,
  },
  islands: {
    id: "islands",
    minValue: 50,
  },
  volcanoes: {
    id: "volcanoes",
    minValue: 100,
  },
};
