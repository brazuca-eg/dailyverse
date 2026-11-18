import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { buildSwitchbackData } from "./build";

const OUTPUT = fileURLToPath(new URL("../../src/games/switchback/puzzles.json", import.meta.url));

writeFileSync(OUTPUT, `${JSON.stringify(buildSwitchbackData())}\n`);
console.log(`Wrote ${OUTPUT}`);
