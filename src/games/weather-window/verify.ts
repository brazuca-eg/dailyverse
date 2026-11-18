import { DIFFICULTIES } from "../../core/difficulty";
import { TRIPS, WEATHERS } from "./catalogue";
import { decodePuzzle } from "./codec";
import type { WeatherData } from "./data";
import { isPuzzleAcceptable } from "./generator";
import { TIER_SETTINGS } from "./tiers";

function isIndexBelow(value: unknown, limit: number): boolean {
  return typeof value === "number" && Number.isInteger(value) && value >= 0 && value < limit;
}

export function verifyWeatherData(data: WeatherData): string[] {
  const issues: string[] = [];
  DIFFICULTIES.forEach((tier) => {
    const settings = TIER_SETTINGS[tier];
    const pool = data[tier];
    if (pool.length < settings.poolSize) {
      issues.push(`${tier}: only ${pool.length} puzzles, need ${settings.poolSize}`);
    }
    const seen = new Set<string>();
    pool.forEach((stored, index) => {
      const where = `${tier} #${index}`;
      const key = JSON.stringify(stored);
      if (seen.has(key)) {
        issues.push(`${where}: duplicate puzzle`);
      }
      seen.add(key);
      const puzzle = decodePuzzle(stored);
      const isShapeOk =
        puzzle.weather.length === settings.days &&
        puzzle.weather.every((weather) => isIndexBelow(weather, WEATHERS.length)) &&
        puzzle.trips.length === settings.trips &&
        puzzle.trips.every((trip) => isIndexBelow(trip, TRIPS.length)) &&
        new Set(puzzle.trips).size === puzzle.trips.length;
      if (!isShapeOk) {
        issues.push(`${where}: invalid forecast or trips`);
        return;
      }
      if (!isPuzzleAcceptable(puzzle, settings)) {
        issues.push(`${where}: does not have a clear best plan that needs memory`);
      }
    });
  });
  return issues;
}
