import { readFileSync } from "node:fs";
import type { WeatherData } from "../../src/games/weather-window/data";
import { verifyWeatherData } from "../../src/games/weather-window/verify";

const text = readFileSync(
  new URL("../../src/games/weather-window/puzzles.json", import.meta.url),
  "utf8",
);
const issues = verifyWeatherData(JSON.parse(text) as WeatherData);

if (issues.length > 0) {
  issues.slice(0, 40).forEach((issue) => console.error(issue));
  process.exitCode = 1;
} else {
  console.log("All Weather Window puzzles are valid.");
}
