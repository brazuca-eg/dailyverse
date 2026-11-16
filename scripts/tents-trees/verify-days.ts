import { buildDailyRound } from "../../src/games/tents-trees/daily";
import { verifyRound } from "../../src/games/tents-trees/verify";

export interface DayReport {
  day: number;
  issues: string[];
}

export function verifyDays(fromDay: number, dayCount: number): DayReport[] {
  return Array.from({ length: dayCount }, (_, offset) => fromDay + offset)
    .map((day) => ({ day, issues: verifyRound(buildDailyRound(day)) }))
    .filter((report) => report.issues.length > 0);
}
