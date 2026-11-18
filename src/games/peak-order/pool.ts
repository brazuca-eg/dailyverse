import { createRandom, hashString, type Random } from "../../core/random";
import type { Item } from "./items";
import { fitsTier, ROUND_SIZE, TIER_RULES, type PeakTier } from "./tiers";

export const MAX_ITEM_USES = 8;
export const MAX_ATTEMPTS = 400000;

function pickDistinct(count: number, size: number, random: Random, taken: number[]): number[] {
  const picked = [...taken];
  while (picked.length < count) {
    const index = Math.floor(random() * size);
    if (!picked.includes(index)) {
      picked.push(index);
    }
  }
  return picked;
}

function findCloseNeighbours(items: readonly Item[], anchor: number, tier: PeakTier): number[] {
  const rules = TIER_RULES[tier];
  const neighbours: number[] = [];
  for (let index = anchor + 1; index < items.length; index += 1) {
    const ratio = items[index].value / items[anchor].value;
    if (ratio > rules.maxClosestRatio) {
      return neighbours;
    }
    if (ratio >= rules.minRatio) {
      neighbours.push(index);
    }
  }
  return neighbours;
}

function sampleIndexes(items: readonly Item[], tier: PeakTier, random: Random): number[] | null {
  if (tier === "medium") {
    return pickDistinct(ROUND_SIZE, items.length, random, []);
  }
  const anchor = Math.floor(random() * items.length);
  const neighbours = findCloseNeighbours(items, anchor, tier);
  if (neighbours.length === 0) {
    return null;
  }
  const partner = neighbours[Math.floor(random() * neighbours.length)];
  return pickDistinct(ROUND_SIZE, items.length, random, [anchor, partner]);
}

export function listCandidates(items: readonly Item[], tier: PeakTier): Item[] {
  return [...items]
    .sort((a, b) => b.editions - a.editions || a.name.localeCompare(b.name))
    .slice(0, TIER_RULES[tier].candidateCount)
    .sort((a, b) => a.value - b.value || a.name.localeCompare(b.name));
}

export function findMinEditions(items: readonly Item[], tier: PeakTier): number {
  return Math.min(...listCandidates(items, tier).map((item) => item.editions));
}

export function buildPool(
  items: readonly Item[],
  tier: PeakTier,
  category: string,
  target: number = TIER_RULES[tier].poolSize,
): Item[][] {
  const candidates = listCandidates(items, tier);
  if (candidates.length < ROUND_SIZE) {
    throw new Error(`Only ${candidates.length} ${tier} ${category} items, need ${ROUND_SIZE}`);
  }
  const minEditions = findMinEditions(items, tier);
  const random = createRandom(hashString(`peak-order:${category}:${tier}`));
  const uses = new Map<string, number>();
  const seen = new Set<string>();
  const pool: Item[][] = [];
  for (let attempt = 0; attempt < MAX_ATTEMPTS && pool.length < target; attempt += 1) {
    const indexes = sampleIndexes(candidates, tier, random);
    if (indexes !== null) {
      const set = indexes.map((index) => candidates[index]).sort((a, b) => a.value - b.value);
      const key = set.map((item) => item.name).join("|");
      const isWorn = set.some((item) => (uses.get(item.name) ?? 0) >= MAX_ITEM_USES);
      if (!seen.has(key) && !isWorn && fitsTier(set, tier, minEditions)) {
        seen.add(key);
        set.forEach((item) => uses.set(item.name, (uses.get(item.name) ?? 0) + 1));
        pool.push(set);
      }
    }
  }
  if (pool.length < target) {
    throw new Error(`Only ${pool.length} of ${target} ${tier} ${category} puzzles could be built`);
  }
  return pool;
}
