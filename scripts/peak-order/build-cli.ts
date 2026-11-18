import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { CATEGORY_IDS, type CategoryId } from "../../src/games/peak-order/categories";
import {
  parseBindings,
  parseEditionCounts,
  parseItemIds,
  rankIds,
} from "../../src/games/peak-order/items";
import {
  BATCH_SIZE,
  CATEGORY_SOURCES,
  RANKED_LIMIT,
  buildEditionsQuery,
  buildOffEarthQuery,
  buildPeakData,
  buildQuery,
  type CategoryRows,
  type RowsByCategory,
} from "./build";

const ROOT = new URL("../../", import.meta.url);
const CACHE_DIR = fileURLToPath(new URL(".cache/peak-order/", ROOT));
const OUTPUT = fileURLToPath(new URL("src/games/peak-order/puzzles.json", ROOT));
const ENDPOINT = "https://query.wikidata.org/sparql";
const USER_AGENT = "dailyverse-data-build/1.0";

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

async function readCached<Raw, Result>(
  file: string,
  load: () => Promise<Raw>,
  revive: (json: unknown) => Result,
): Promise<Result> {
  if (!existsSync(file)) {
    writeFileSync(file, JSON.stringify(await load()));
  }
  return revive(JSON.parse(readFileSync(file, "utf8")));
}

async function downloadEditions(ids: readonly string[]): Promise<Record<string, number>> {
  const counts: Record<string, number> = {};
  for (let start = 0; start < ids.length; start += BATCH_SIZE) {
    const batch = ids.slice(start, start + BATCH_SIZE);
    const found = parseEditionCounts(await runQuery(buildEditionsQuery(batch)));
    found.forEach((count, id) => {
      counts[id] = count;
    });
  }
  return counts;
}

async function downloadOffEarth(ids: readonly string[]): Promise<string[]> {
  const found: string[] = [];
  for (let start = 0; start < ids.length; start += BATCH_SIZE) {
    const batch = ids.slice(start, start + BATCH_SIZE);
    found.push(...parseItemIds(await runQuery(buildOffEarthQuery(batch))));
  }
  return found;
}

async function readCategory(category: CategoryId): Promise<CategoryRows> {
  console.log(`Reading ${category}`);
  const rows = await readCached(
    `${CACHE_DIR}${category}.json`,
    () => runQuery(buildQuery(CATEGORY_SOURCES[category])),
    parseBindings,
  );
  const counts = await readCached(
    `${CACHE_DIR}${category}-editions.json`,
    () => downloadEditions(rankIds(rows, RANKED_LIMIT)),
    (json) => json as Record<string, number>,
  );
  const offEarth = await readCached(
    `${CACHE_DIR}${category}-offearth.json`,
    () => downloadOffEarth(rankIds(rows, RANKED_LIMIT)),
    (json) => new Set(json as string[]),
  );
  return { rows, editions: new Map(Object.entries(counts)), offEarth };
}

mkdirSync(CACHE_DIR, { recursive: true });
mkdirSync(dirname(OUTPUT), { recursive: true });
const entries = [];
for (const category of CATEGORY_IDS) {
  entries.push([category, await readCategory(category)] as const);
}
const data = buildPeakData(Object.fromEntries(entries) as RowsByCategory);
writeFileSync(OUTPUT, `${JSON.stringify(data)}\n`);
console.log(`Wrote ${OUTPUT}`);
