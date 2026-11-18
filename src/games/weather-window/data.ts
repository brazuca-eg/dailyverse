import type { Difficulty } from "../../core/difficulty";
import type { StoredPuzzle } from "./codec";
import puzzleData from "./puzzles.json";

export const WEATHER_LAUNCH_DATE = new Date("2026-11-19T00:00:00Z");

export type WeatherData = Record<Difficulty, StoredPuzzle[]>;

export const weatherData = puzzleData as WeatherData;
