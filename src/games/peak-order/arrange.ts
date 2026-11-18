import type { Random } from "../../core/random";
import { shuffle } from "../../core/random";

const MAX_START_ATTEMPTS = 1000;
const MAX_START_CORRECT = 1;

export function countFixedPoints(order: readonly number[]): number {
  return order.filter((item, position) => item === position).length;
}

function rotate(size: number): number[] {
  return Array.from({ length: size }, (_, position) => (position + 1) % size);
}

export function createStartOrder(size: number, random: Random): number[] {
  const identity = Array.from({ length: size }, (_, index) => index);
  const attempts = Array.from({ length: MAX_START_ATTEMPTS }, () => shuffle(identity, random));
  const found = attempts.find((order) => countFixedPoints(order) <= MAX_START_CORRECT);
  return found ?? rotate(size);
}

export function moveItem(order: readonly number[], from: number, to: number): number[] {
  if (!Number.isInteger(from) || !Number.isInteger(to) || from < 0 || to < 0) {
    throw new Error(`Cannot move position ${from} to ${to}`);
  }
  if (from >= order.length || to >= order.length) {
    throw new Error(`Cannot move position ${from} to ${to} in a list of ${order.length}`);
  }
  const moved = order.filter((_, position) => position !== from);
  return [...moved.slice(0, to), order[from], ...moved.slice(to)];
}
