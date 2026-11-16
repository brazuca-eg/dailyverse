import { useMemo } from "react";
import { calculateDaysSinceLaunch, pickDailyItem } from "../core/daily";

export interface TodaysItem<T> {
  dayIndex: number;
  item: T;
}

export function useTodaysItem<T>(items: readonly T[], launchDate: Date): TodaysItem<T> {
  return useMemo(() => {
    const dayIndex = calculateDaysSinceLaunch(new Date(), launchDate);
    return { dayIndex, item: pickDailyItem(items, dayIndex) };
  }, [items, launchDate]);
}
