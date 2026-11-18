import { readFileSync } from "node:fs";
import { verifyPeakData } from "../../src/games/peak-order/verify";
import type { PeakData } from "../../src/games/peak-order/types";

const text = readFileSync(
  new URL("../../src/games/peak-order/puzzles.json", import.meta.url),
  "utf8",
);
const issues = verifyPeakData(JSON.parse(text) as PeakData);

if (issues.length > 0) {
  issues.forEach((issue) => console.error(issue));
  process.exitCode = 1;
} else {
  console.log("All Peak Order puzzles are valid.");
}
