import { buildDailyPuzzle } from "../../src/games/spot-difference/daily";
import { verifyPuzzle } from "./verify";

export interface DayReport {
  day: number;
  issues: string[];
}

export function verifyDays(fromDay: number, dayCount: number): DayReport[] {
  return Array.from({ length: dayCount }, (_, offset) => fromDay + offset)
    .map((day) => ({ day, issues: verifyPuzzle(buildDailyPuzzle(day)) }))
    .filter((report) => report.issues.length > 0);
}
