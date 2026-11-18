import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { buildBearData } from "./build";

const OUTPUT = fileURLToPath(new URL("../../src/games/bear-sweeper/puzzles.json", import.meta.url));

writeFileSync(OUTPUT, `${JSON.stringify(buildBearData())}\n`);
console.log(`Wrote ${OUTPUT}`);
