import { useMemo } from "react";
import { pickDailyItem } from "../core/daily";
import { useDayIndex } from "./useDayIndex";

export interface TodaysItem<T> {
  dayIndex: number;
  item: T;
}

export function useTodaysItem<T>(items: readonly T[], launchDate: Date): TodaysItem<T> {
  const dayIndex = useDayIndex(launchDate);
  return useMemo(() => ({ dayIndex, item: pickDailyItem(items, dayIndex) }), [items, dayIndex]);
}
