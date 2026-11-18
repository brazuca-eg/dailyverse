import { WEEKLY_DIFFICULTY_PATTERN, type Difficulty } from "./difficulty";
import { modulo } from "./modulo";
import { createRandom, hashString, shuffle } from "./random";

const orders = new Map<string, number[]>();

function readOrder(namespace: string, tier: Difficulty, size: number): number[] {
  const key = `${tier}:${size}`;
  const cacheKey = `${namespace}:${key}`;
  const known = orders.get(cacheKey);
  if (known) {
    return known;
  }
  const order = shuffle(
    Array.from({ length: size }, (_, index) => index),
    createRandom(hashString(`${namespace}:order:${key}`)),
  );
  orders.set(cacheKey, order);
  return order;
}

function countInWeek(tier: Difficulty, until = WEEKLY_DIFFICULTY_PATTERN.length): number {
  return WEEKLY_DIFFICULTY_PATTERN.slice(0, until).filter((candidate) => candidate === tier).length;
}

export function readTierOfDay(dayIndex: number): Difficulty {
  return WEEKLY_DIFFICULTY_PATTERN[modulo(dayIndex, WEEKLY_DIFFICULTY_PATTERN.length)];
}

export function pickPoolIndex(
  namespace: string,
  dayIndex: number,
  poolSizes: Readonly<Record<Difficulty, number>>,
): { tier: Difficulty; poolIndex: number } {
  const weekLength = WEEKLY_DIFFICULTY_PATTERN.length;
  const weekday = modulo(dayIndex, weekLength);
  const tier = WEEKLY_DIFFICULTY_PATTERN[weekday];
  const week = Math.floor(dayIndex / weekLength);
  const occurrence = week * countInWeek(tier) + countInWeek(tier, weekday);
  const order = readOrder(namespace, tier, poolSizes[tier]);
  return { tier, poolIndex: order[modulo(occurrence, order.length)] };
}
