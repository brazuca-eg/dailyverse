import { readFileSync } from "node:fs";
import type { SudokuData } from "../../src/games/trail-sudoku/data";
import { verifySudokuData } from "../../src/games/trail-sudoku/verify";

const text = readFileSync(
  new URL("../../src/games/trail-sudoku/puzzles.json", import.meta.url),
  "utf8",
);
const issues = verifySudokuData(JSON.parse(text) as SudokuData);

if (issues.length > 0) {
  issues.slice(0, 40).forEach((issue) => console.error(issue));
  process.exitCode = 1;
} else {
  console.log("All Trail Sudoku puzzles are valid.");
}
