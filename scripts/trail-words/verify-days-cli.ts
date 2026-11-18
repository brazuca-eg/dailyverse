import { readFileSync } from "node:fs";
import { verifyDays } from "./verify-days";

const DEFAULT_FROM_DAY = 0;
const DEFAULT_DAY_COUNT = 730;

function readNumber(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return value !== undefined && Number.isInteger(parsed) ? parsed : fallback;
}

const fromDay = readNumber(process.argv[2], DEFAULT_FROM_DAY);
const dayCount = readNumber(process.argv[3], DEFAULT_DAY_COUNT);
const wordText = readFileSync(
  new URL("../../src/games/trail-words/words.txt", import.meta.url),
  "utf8",
);
const failures = verifyDays(fromDay, dayCount, wordText);

if (failures.length > 0) {
  failures.forEach((report) => console.error(`day ${report.day}: ${report.issues.join("; ")}`));
  process.exitCode = 1;
} else {
  console.log(`All ${dayCount} puzzles from day ${fromDay} are valid.`);
}
