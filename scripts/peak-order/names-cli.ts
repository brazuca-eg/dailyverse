import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { CATEGORY_IDS, type CategoryId } from "../../src/games/peak-order/categories";
import { parseBindings } from "../../src/games/peak-order/items";
import type { PeakData } from "../../src/games/peak-order/types";
import {
  buildLocalNames,
  buildNamesQuery,
  findIdsByName,
  mergeLabels,
  parseNameRows,
  NAME_LOCALES,
  type LabelsById,
} from "./names";

const ROOT = new URL("../../", import.meta.url);
const CACHE_DIR = fileURLToPath(new URL(".cache/peak-order/", ROOT));
const GAME_DIR = fileURLToPath(new URL("src/games/peak-order/", ROOT));
const ENDPOINT = "https://query.wikidata.org/sparql";
const USER_AGENT = "dailyverse-data-build/1.0";
const BATCH_SIZE = 80;
const ATTEMPTS = 4;
const RETRY_DELAY_MS = 5000;

async function runQuery(query: string, attempt = 1): Promise<unknown> {
  const response = await fetch(`${ENDPOINT}?${new URLSearchParams({ query })}`, {
    headers: { Accept: "application/sparql-results+json", "User-Agent": USER_AGENT },
  });
  if (response.ok) {
    return response.json();
  }
  if (attempt >= ATTEMPTS) {
    throw new Error(`Wikidata answered ${response.status}`);
  }
  await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS * attempt));
  return runQuery(query, attempt + 1);
}

function readJson(path: string): unknown {
  return JSON.parse(readFileSync(path, "utf8"));
}

async function fetchLabels(ids: readonly string[]): Promise<LabelsById> {
  const batches = Array.from({ length: Math.ceil(ids.length / BATCH_SIZE) }, (_, index) =>
    ids.slice(index * BATCH_SIZE, (index + 1) * BATCH_SIZE),
  );
  return batches.reduce<Promise<LabelsById>>(async (previous, batch, index) => {
    const labels = await previous;
    console.log(`Labels, batch ${index + 1} of ${batches.length}`);
    return mergeLabels(labels, parseNameRows(await runQuery(buildNamesQuery(batch))));
  }, Promise.resolve(new Map()));
}

const data = readJson(`${GAME_DIR}puzzles.json`) as PeakData;
const idsByCategory = Object.fromEntries(
  CATEGORY_IDS.map((category) => [
    category,
    findIdsByName(parseBindings(readJson(`${CACHE_DIR}${category}.json`))),
  ]),
) as Record<CategoryId, Map<string, string>>;
const namesByCategory = Object.fromEntries(
  CATEGORY_IDS.map((category) => [category, data[category].items.map(([name]) => name)]),
) as Record<CategoryId, string[]>;

const ids = CATEGORY_IDS.flatMap((category) =>
  namesByCategory[category].flatMap((name) => idsByCategory[category].get(name) ?? []),
);
const missing = CATEGORY_IDS.flatMap((category) =>
  namesByCategory[category].filter((name) => !idsByCategory[category].has(name)),
);
console.log(`${ids.length} items with an id, ${missing.length} without`);

const labels = await fetchLabels([...new Set(ids)]);
NAME_LOCALES.forEach((locale) => {
  const names = buildLocalNames(namesByCategory, idsByCategory, labels, locale);
  const count = CATEGORY_IDS.reduce(
    (sum, category) => sum + Object.keys(names[category]).length,
    0,
  );
  writeFileSync(`${GAME_DIR}names.${locale}.json`, `${JSON.stringify(names)}\n`);
  console.log(`${locale}: ${count} names`);
});
