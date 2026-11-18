export interface Binding {
  id: string;
  name: string;
  value: number;
  links: number;
}

export interface Item {
  name: string;
  value: number;
  editions: number;
}

export const MAX_SOURCE_SPREAD = 1.01;
export const MAX_NAME_LENGTH = 40;

interface SparqlCell {
  value: string;
}

interface SparqlRow {
  item: SparqlCell;
  itemLabel: SparqlCell;
  value: SparqlCell;
  links: SparqlCell;
}

export function parseBindings(json: unknown): Binding[] {
  const rows = (json as { results?: { bindings?: SparqlRow[] } }).results?.bindings;
  if (!Array.isArray(rows)) {
    throw new Error("The response has no results.bindings list");
  }
  return rows.map((row) => ({
    id: row.item.value.split("/").pop() ?? "",
    name: row.itemLabel.value,
    value: Number(row.value.value),
    links: Number(row.links.value),
  }));
}

export function isUsableName(id: string, name: string): boolean {
  return (
    name !== id &&
    name.length > 0 &&
    name.length <= MAX_NAME_LENGTH &&
    !/[(),\d]/.test(name) &&
    !/^Q\d+$/.test(name)
  );
}

function takeMedian(values: readonly number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

export function parseEditionCounts(json: unknown): Map<string, number> {
  const rows = (json as { results?: { bindings?: { item: SparqlCell; core: SparqlCell }[] } })
    .results?.bindings;
  if (!Array.isArray(rows)) {
    throw new Error("The response has no results.bindings list");
  }
  return new Map(
    rows.map((row) => [row.item.value.split("/").pop() ?? "", Number(row.core.value)]),
  );
}

export function parseItemIds(json: unknown): string[] {
  const rows = (json as { results?: { bindings?: { item: SparqlCell }[] } }).results?.bindings;
  if (!Array.isArray(rows)) {
    throw new Error("The response has no results.bindings list");
  }
  return rows.map((row) => row.item.value.split("/").pop() ?? "");
}

export function rankIds(rows: readonly Binding[], limit: number): string[] {
  const links = new Map<string, number>();
  rows.forEach((row) => links.set(row.id, row.links));
  return [...links.keys()]
    .sort((a, b) => (links.get(b) ?? 0) - (links.get(a) ?? 0) || a.localeCompare(b))
    .slice(0, limit);
}

export function removeIds(rows: readonly Binding[], ids: ReadonlySet<string>): Binding[] {
  return rows.filter((row) => !ids.has(row.id));
}

export function cleanItems(
  rows: readonly Binding[],
  editions: ReadonlyMap<string, number>,
  factor: number,
  minValue: number,
): Item[] {
  const groups = new Map<string, Binding[]>();
  rows.forEach((row) => groups.set(row.id, [...(groups.get(row.id) ?? []), row]));
  const items: Item[] = [];
  groups.forEach((group, id) => {
    const values = group
      .map((row) => row.value)
      .filter((value) => Number.isFinite(value) && value > 0);
    const spread = Math.max(...values) / Math.min(...values);
    const value = Math.round(takeMedian(values) * factor);
    if (
      values.length === group.length &&
      spread <= MAX_SOURCE_SPREAD &&
      editions.has(id) &&
      isUsableName(id, group[0].name) &&
      value >= minValue
    ) {
      items.push({ name: group[0].name, value, editions: editions.get(id) as number });
    }
  });
  const nameCounts = new Map<string, number>();
  items.forEach((item) => nameCounts.set(item.name, (nameCounts.get(item.name) ?? 0) + 1));
  return items.filter((item) => nameCounts.get(item.name) === 1);
}
