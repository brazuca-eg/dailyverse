export const CATEGORY_IDS = ["mountains", "rivers", "lakes", "islands", "volcanoes"] as const;

export type CategoryId = (typeof CATEGORY_IDS)[number];

export interface CategoryInfo {
  id: CategoryId;
  title: string;
  measure: string;
  unit: string;
  lowest: string;
  highest: string;
  minValue: number;
}

export const CATEGORIES: Record<CategoryId, CategoryInfo> = {
  mountains: {
    id: "mountains",
    title: "Mountains",
    measure: "height",
    unit: "m",
    lowest: "lowest",
    highest: "highest",
    minValue: 300,
  },
  rivers: {
    id: "rivers",
    title: "Rivers",
    measure: "length",
    unit: "km",
    lowest: "shortest",
    highest: "longest",
    minValue: 30,
  },
  lakes: {
    id: "lakes",
    title: "Lakes",
    measure: "area",
    unit: "km²",
    lowest: "smallest",
    highest: "largest",
    minValue: 50,
  },
  islands: {
    id: "islands",
    title: "Islands",
    measure: "area",
    unit: "km²",
    lowest: "smallest",
    highest: "largest",
    minValue: 50,
  },
  volcanoes: {
    id: "volcanoes",
    title: "Volcanoes",
    measure: "height",
    unit: "m",
    lowest: "lowest",
    highest: "highest",
    minValue: 100,
  },
};
