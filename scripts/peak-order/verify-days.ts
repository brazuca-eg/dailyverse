import { pickDailyPeakPuzzle } from "../../src/games/peak-order/daily";
import { fitsTier } from "../../src/games/peak-order/tiers";
import type { PeakData } from "../../src/games/peak-order/types";

export interface DayReport {
  day: number;
  issues: string[];
}

export function listDayIssues(day: number, data: PeakData): string[] {
  const { category, tier, poolIndex } = pickDailyPeakPuzzle(day, data);
  const items = data[category][tier][poolIndex].map((index) => {
    const [name, value, editions] = data[category].items[index];
    return { name, value, editions };
  });
  const checks: [boolean, string][] = [
    [
      !fitsTier(items, tier, data[category].minEditions[tier]),
      `${category}:${tier}:${poolIndex} does not fit the ${tier} rules`,
    ],
  ];
  return checks.filter(([failed]) => failed).map(([, message]) => message);
}

export function verifyDays(fromDay: number, dayCount: number, data: PeakData): DayReport[] {
  const days = Array.from({ length: dayCount }, (_, offset) => fromDay + offset);
  const ids = days.map((day) => {
    const { category, tier, poolIndex } = pickDailyPeakPuzzle(day, data);
    return `${category}:${tier}:${poolIndex}`;
  });
  return days
    .map((day, position) => ({
      day,
      issues: [
        ...listDayIssues(day, data),
        ...(ids.indexOf(ids[position]) === position ? [] : ["repeats an earlier day"]),
      ],
    }))
    .filter((report) => report.issues.length > 0);
}
