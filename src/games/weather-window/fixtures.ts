import { buildWeatherRound } from "./daily";
import type { WeatherPuzzle } from "./types";

export const easyRound = buildWeatherRound("easy", 0);
export const mediumRound = buildWeatherRound("medium", 0);
export const hardRound = buildWeatherRound("hard", 0);

export const SUNNY = 0;
export const CLOUDY = 1;
export const RAINY = 2;
export const WINDY = 3;
export const SNOWY = 4;
export const HIKE = 0;
export const KAYAK = 1;
export const SKI = 4;

export const OBVIOUS: WeatherPuzzle = { weather: [SUNNY, SNOWY, CLOUDY], trips: [HIKE, SKI] };
export const CONFLICT: WeatherPuzzle = { weather: [SUNNY, CLOUDY], trips: [HIKE, KAYAK] };
