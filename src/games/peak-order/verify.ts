import { CATEGORIES, CATEGORY_IDS } from "./categories";
import { isUsableName, type Item } from "./items";
import { MAX_ITEM_USES } from "./pool";
import { fitsTier, PEAK_TIERS, ROUND_SIZE, TIER_RULES, type PeakTier } from "./tiers";
import type { PeakData } from "./types";

function toItem([name, value, editions]: PeakData["mountains"]["items"][number]): Item {
  return { name, value, editions };
}

function listItemIssues(label: string, items: readonly Item[], minValue: number): string[] {
  const issues: string[] = [];
  const names = new Set<string>();
  items.forEach((item) => {
    if (!isUsableName("", item.name)) {
      issues.push(`${label}: unusable name "${item.name}"`);
    }
    if (names.has(item.name)) {
      issues.push(`${label}: duplicate name "${item.name}"`);
    }
    names.add(item.name);
    if (!Number.isInteger(item.value) || item.value < minValue) {
      issues.push(`${label}: "${item.name}" has an invalid value ${item.value}`);
    }
  });
  return issues;
}

function listPoolIssues(
  label: string,
  tier: PeakTier,
  items: readonly Item[],
  pool: readonly number[][],
  minEditions: number,
): string[] {
  const issues: string[] = [];
  const keys = new Set<string>();
  const uses = new Map<number, number>();
  if (pool.length < TIER_RULES[tier].poolSize) {
    issues.push(`${label} ${tier}: only ${pool.length} puzzles, need ${TIER_RULES[tier].poolSize}`);
  }
  pool.forEach((indexes, position) => {
    const where = `${label} ${tier} #${position}`;
    const isValid =
      indexes.length === ROUND_SIZE &&
      indexes.every((index) => Number.isInteger(index) && index >= 0 && index < items.length);
    if (!isValid) {
      issues.push(`${where}: invalid item indexes`);
      return;
    }
    const set = indexes.map((index) => items[index]);
    if (!fitsTier(set, tier, minEditions)) {
      issues.push(`${where}: does not fit the ${tier} rules`);
    }
    if (keys.has(indexes.join(","))) {
      issues.push(`${where}: duplicate puzzle`);
    }
    keys.add(indexes.join(","));
    indexes.forEach((index) => uses.set(index, (uses.get(index) ?? 0) + 1));
  });
  uses.forEach((count, index) => {
    if (count > MAX_ITEM_USES) {
      issues.push(`${label} ${tier}: "${items[index]?.name}" is used ${count} times`);
    }
  });
  return issues;
}

export function verifyPeakData(data: PeakData): string[] {
  const issues: string[] = [];
  CATEGORY_IDS.forEach((category) => {
    const entry = data[category];
    const items = entry.items.map(toItem);
    issues.push(...listItemIssues(category, items, CATEGORIES[category].minValue));
    PEAK_TIERS.forEach((tier) => {
      if (!(entry.minEditions[tier] >= TIER_RULES[tier].floorEditions)) {
        issues.push(
          `${category} ${tier}: the popularity cut-off ${entry.minEditions[tier]} is below the floor`,
        );
      }
    });
    PEAK_TIERS.forEach((tier) =>
      issues.push(...listPoolIssues(category, tier, items, entry[tier], entry.minEditions[tier])),
    );
    const mediumKeys = new Set(entry.medium.map((set) => set.join(",")));
    entry.hard.forEach((set, position) => {
      if (mediumKeys.has(set.join(","))) {
        issues.push(`${category} hard #${position}: also a medium puzzle`);
      }
    });
  });
  return issues;
}
