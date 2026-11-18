import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { buildWeatherData } from "./build";

const OUTPUT = fileURLToPath(
  new URL("../../src/games/weather-window/puzzles.json", import.meta.url),
);

writeFileSync(OUTPUT, `${JSON.stringify(buildWeatherData())}\n`);
console.log(`Wrote ${OUTPUT}`);
