import { createStateStorage } from "../../core/gameStorage";
import { isRecord } from "../../core/guards";
import { checkOrder } from "./feedback";
import { MAX_CHECKS, type PeakState } from "./game";
import { ROUND_SIZE } from "./tiers";

function isOrder(value: unknown): value is number[] {
  return (
    Array.isArray(value) &&
    value.length === ROUND_SIZE &&
    Array.from({ length: ROUND_SIZE }, (_, item) => item).every((item) => value.includes(item))
  );
}

function isHistory(value: unknown): value is number[][] {
  if (!Array.isArray(value) || value.length > MAX_CHECKS || !value.every(isOrder)) {
    return false;
  }
  const solvedBeforeEnd = value.slice(0, -1).some((order) => checkOrder(order).isSolved);
  const repeats = value.slice(1).some((order, index) => order.join() === value[index].join());
  return !solvedBeforeEnd && !repeats;
}

export function isPeakState(value: unknown): value is PeakState {
  if (!isRecord(value)) {
    return false;
  }
  const { puzzleId, order, history } = value;
  return typeof puzzleId === "string" && isOrder(order) && isHistory(history);
}

export const peakOrderStorage = createStateStorage("peak-order", isPeakState);
