import { readFileSync } from "node:fs";
import type { SwitchbackData } from "../../src/games/switchback/data";
import { verifySwitchbackData } from "../../src/games/switchback/verify";

const text = readFileSync(
  new URL("../../src/games/switchback/puzzles.json", import.meta.url),
  "utf8",
);
const issues = verifySwitchbackData(JSON.parse(text) as SwitchbackData);

if (issues.length > 0) {
  issues.slice(0, 40).forEach((issue) => console.error(issue));
  process.exitCode = 1;
} else {
  console.log("All Switchback puzzles are valid.");
}
