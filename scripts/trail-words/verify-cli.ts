import { readFileSync } from "node:fs";
import type { TrailTier } from "../../src/games/trail-words/tiers";
import { verifyTrailData } from "../../src/games/trail-words/verify";

const wordText = readFileSync(
  new URL("../../src/games/trail-words/words.txt", import.meta.url),
  "utf8",
);
const puzzles = JSON.parse(
  readFileSync(new URL("../../src/games/trail-words/puzzles.json", import.meta.url), "utf8"),
) as Record<TrailTier, string[]>;

const issues = verifyTrailData(wordText, puzzles);
if (issues.length > 0) {
  console.error(issues.join("\n"));
  process.exitCode = 1;
} else {
  console.log(
    `The word list and all ${puzzles.medium.length + puzzles.hard.length} puzzles are valid.`,
  );
}
