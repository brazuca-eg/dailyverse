import { pickDailyTrailPuzzle } from "../../src/games/trail-words/daily";
import { measurePuzzle } from "../../src/games/trail-words/analysis";
import { buildTrailPuzzle } from "../../src/games/trail-words/puzzle";
import { fitsTier } from "../../src/games/trail-words/tiers";
import { parseWordList, type WordList } from "../../src/games/trail-words/words";

export interface DayReport {
  day: number;
  issues: string[];
}

export function listDayIssues(day: number, list: WordList): string[] {
  const { code, tier } = pickDailyTrailPuzzle(day);
  const puzzle = buildTrailPuzzle(code, tier, list);
  const metrics = measurePuzzle(puzzle.words, puzzle.letterMask, puzzle.centreBit, list.common);
  const checks: [boolean, string][] = [
    [!fitsTier(metrics, tier), `${code} does not fit the ${tier} rules`],
    [!puzzle.pangrams.some((word) => list.common.has(word)), `${code} has no common pangram`],
    [puzzle.maxScore <= 0, `${code} is worth no points`],
  ];
  return checks.filter(([failed]) => failed).map(([, message]) => message);
}

export function verifyDays(fromDay: number, dayCount: number, wordText: string): DayReport[] {
  const list = parseWordList(wordText);
  const days = Array.from({ length: dayCount }, (_, offset) => fromDay + offset);
  const repeats = days
    .map((day) => ({ day, code: pickDailyTrailPuzzle(day).code }))
    .filter((entry, index, all) => all.findIndex((other) => other.code === entry.code) !== index);
  return days
    .map((day) => ({
      day,
      issues: [
        ...listDayIssues(day, list),
        ...(repeats.some((entry) => entry.day === day) ? ["repeats an earlier day"] : []),
      ],
    }))
    .filter((report) => report.issues.length > 0);
}
