import { readFileSync } from "node:fs";
import type { BearData } from "../../src/games/bear-sweeper/data";
import { verifyBearData } from "../../src/games/bear-sweeper/verify";

const text = readFileSync(
  new URL("../../src/games/bear-sweeper/puzzles.json", import.meta.url),
  "utf8",
);
const issues = verifyBearData(JSON.parse(text) as BearData);

if (issues.length > 0) {
  issues.slice(0, 40).forEach((issue) => console.error(issue));
  process.exitCode = 1;
} else {
  console.log("All Bear Sweeper puzzles are valid.");
}
