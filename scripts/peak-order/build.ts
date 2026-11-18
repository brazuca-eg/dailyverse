import { CATEGORIES, CATEGORY_IDS, type CategoryId } from "../../src/games/peak-order/categories";
import { cleanItems, removeIds, type Binding, type Item } from "../../src/games/peak-order/items";
import { buildPool, findMinEditions } from "../../src/games/peak-order/pool";
import { PEAK_TIERS, TIER_RULES, type PeakTier } from "../../src/games/peak-order/tiers";
import type { CategoryData, PeakData } from "../../src/games/peak-order/types";

export interface CategorySource {
  wikidataClass: string;
  property: string;
  factor: number;
}

export const CATEGORY_SOURCES: Record<CategoryId, CategorySource> = {
  mountains: { wikidataClass: "Q8502", property: "P2044", factor: 1 },
  rivers: { wikidataClass: "Q4022", property: "P2043", factor: 0.001 },
  lakes: { wikidataClass: "Q23397", property: "P2046", factor: 0.000001 },
  islands: { wikidataClass: "Q23442", property: "P2046", factor: 0.000001 },
  volcanoes: { wikidataClass: "Q8072", property: "P2044", factor: 1 },
};

export const MIN_SITELINKS = 10;
export const MAX_ROWS = 4000;
export const RANKED_LIMIT = 600;
export const BATCH_SIZE = 100;
export const EXCLUDED_WIKIS = ["ceb", "sv", "war"];

export function buildQuery(source: CategorySource): string {
  return `SELECT ?item ?itemLabel ?value ?links WHERE {
  ?item wdt:P31 wd:${source.wikidataClass} .
  ?item p:${source.property}/psn:${source.property}/wikibase:quantityAmount ?value .
  ?item wikibase:sitelinks ?links .
  FILTER(?links >= ${MIN_SITELINKS})
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
}
ORDER BY DESC(?links)
LIMIT ${MAX_ROWS}
`;
}

export function buildEditionsQuery(ids: readonly string[]): string {
  const exclusions = EXCLUDED_WIKIS.map((wiki) => `!CONTAINS(STR(?site), "//${wiki}.")`).join(
    " && ",
  );
  return `SELECT ?item (COUNT(?sl) AS ?core) WHERE {
  VALUES ?item { ${ids.map((id) => `wd:${id}`).join(" ")} }
  ?sl schema:about ?item ; schema:isPartOf ?site .
  FILTER(CONTAINS(STR(?site), "wikipedia.org"))
  FILTER(${exclusions})
} GROUP BY ?item
`;
}

export function buildOffEarthQuery(ids: readonly string[]): string {
  return `SELECT DISTINCT ?item WHERE {
  VALUES ?item { ${ids.map((id) => `wd:${id}`).join(" ")} }
  ?item wdt:P376 ?body .
  FILTER(?body != wd:Q2)
}
`;
}

export interface CategoryRows {
  rows: Binding[];
  editions: Map<string, number>;
  offEarth: ReadonlySet<string>;
}

export type RowsByCategory = Record<CategoryId, CategoryRows>;
export type PoolTargets = Record<PeakTier, number>;

function buildCategoryData(
  items: readonly Item[],
  category: CategoryId,
  targets: PoolTargets,
): CategoryData {
  const pools = Object.fromEntries(
    PEAK_TIERS.map((tier) => [tier, buildPool(items, tier, category, targets[tier])]),
  ) as Record<PeakTier, Item[][]>;
  const used = new Map<string, Item>();
  PEAK_TIERS.forEach((tier) =>
    pools[tier].forEach((set) => set.forEach((item) => used.set(item.name, item))),
  );
  const stored = [...used.values()].sort(
    (a, b) => a.value - b.value || a.name.localeCompare(b.name),
  );
  const indexByName = new Map(stored.map((item, index) => [item.name, index]));
  const toIndexes = (tier: PeakTier) =>
    pools[tier].map((set) => set.map((item) => indexByName.get(item.name) as number));
  return {
    items: stored.map((item) => [item.name, item.value, item.editions]),
    medium: toIndexes("medium"),
    hard: toIndexes("hard"),
    minEditions: {
      medium: findMinEditions(items, "medium"),
      hard: findMinEditions(items, "hard"),
    },
  };
}

export function buildPeakData(
  rows: RowsByCategory,
  targets: PoolTargets = {
    medium: TIER_RULES.medium.poolSize,
    hard: TIER_RULES.hard.poolSize,
  },
): PeakData {
  const volcanoIds = new Set(rows.volcanoes.rows.map((row) => row.id));
  const dropIds = (entry: CategoryRows, extra: ReadonlySet<string>): CategoryRows => ({
    ...entry,
    rows: removeIds(entry.rows, new Set([...entry.offEarth, ...extra])),
  });
  const noIds: ReadonlySet<string> = new Set();
  return Object.fromEntries(
    CATEGORY_IDS.map((category) => {
      const info = CATEGORIES[category];
      const { rows: categoryRows, editions } = dropIds(
        rows[category],
        category === "mountains" ? volcanoIds : noIds,
      );
      const items = cleanItems(
        categoryRows,
        editions,
        CATEGORY_SOURCES[category].factor,
        info.minValue,
      );
      return [category, buildCategoryData(items, category, targets)];
    }),
  ) as PeakData;
}
