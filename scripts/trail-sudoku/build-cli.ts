import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { buildSudokuData } from "./build";

const OUTPUT = fileURLToPath(new URL("../../src/games/trail-sudoku/puzzles.json", import.meta.url));

writeFileSync(OUTPUT, `${JSON.stringify(buildSudokuData())}\n`);
console.log(`Wrote ${OUTPUT}`);
