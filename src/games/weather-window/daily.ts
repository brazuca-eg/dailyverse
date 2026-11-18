import type { Difficulty } from "../../core/difficulty";
import { pickPoolIndex } from "../../core/dailyPool";
import { decodePuzzle } from "./codec";
import { weatherData, type WeatherData } from "./data";
import type { WeatherRound } from "./types";

export interface DailyWeatherPick {
  tier: Difficulty;
  poolIndex: number;
}

export function pickDailyWeather(
  dayIndex: number,
  data: WeatherData = weatherData,
): DailyWeatherPick {
  return pickPoolIndex("weather-window", dayIndex, {
    easy: data.easy.length,
    medium: data.medium.length,
    hard: data.hard.length,
  });
}

export function buildWeatherRound(
  tier: Difficulty,
  poolIndex: number,
  data: WeatherData = weatherData,
): WeatherRound {
  const stored = data[tier][poolIndex];
  if (stored === undefined) {
    throw new Error(`There is no ${tier} Weather Window number ${poolIndex}`);
  }
  return { tier, poolIndex, puzzle: decodePuzzle(stored) };
}

export function buildDailyWeatherRound(
  dayIndex: number,
  data: WeatherData = weatherData,
): WeatherRound {
  const { tier, poolIndex } = pickDailyWeather(dayIndex, data);
  return buildWeatherRound(tier, poolIndex, data);
}

export function findDailyWeatherRound(
  dayIndex: number,
  data: WeatherData = weatherData,
): WeatherRound | null {
  try {
    return buildDailyWeatherRound(dayIndex, data);
  } catch {
    return null;
  }
}
