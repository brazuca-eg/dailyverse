import { useMemo } from "react";
import { calculateDaysSinceLaunch } from "../core/daily";

export function useDayIndex(launchDate: Date): number {
  return useMemo(() => calculateDaysSinceLaunch(new Date(), launchDate), [launchDate]);
}
