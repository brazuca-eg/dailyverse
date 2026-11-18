import { CATEGORIES, type CategoryId } from "./categories";

const numberFormat = new Intl.NumberFormat("en-US");

export function formatValue(value: number, category: CategoryId): string {
  return `${numberFormat.format(value)} ${CATEGORIES[category].unit}`;
}

export function buildPrompt(category: CategoryId): string {
  const { title, lowest, highest } = CATEGORIES[category];
  return `Order these ${title.toLowerCase()} from ${lowest} to ${highest}`;
}
