import { describe, expect, it } from "vitest";
import { DIFFICULTIES, WEEKLY_DIFFICULTY_PATTERN } from "../../core/difficulty";
import { weatherData, type WeatherData } from "./data";
import {
  buildDailyWeatherRound,
  buildWeatherRound,
  findDailyWeatherRound,
  pickDailyWeather,
} from "./daily";
import { TIER_SETTINGS } from "./tiers";

const DAYS = Array.from({ length: 730 }, (_, day) => day);

describe("pickDailyWeather", () => {
  it("follows the weekly pattern for the tier", () => {
    DAYS.slice(0, 28).forEach((day) => {
      expect(pickDailyWeather(day).tier).toBe(WEEKLY_DIFFICULTY_PATTERN[day % 7]);
    });
  });

  it("picks a puzzle that exists in the pool of its tier", () => {
    DAYS.forEach((day) => {
      const { tier, poolIndex } = pickDailyWeather(day);
      expect(weatherData[tier][poolIndex]).toBeDefined();
    });
  });

  it("never repeats a puzzle in the first two years", () => {
    const keys = DAYS.map((day) => {
      const { tier, poolIndex } = pickDailyWeather(day);
      return `${tier}:${poolIndex}`;
    });
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("uses the size of the data it is given", () => {
    const small: WeatherData = {
      easy: weatherData.easy.slice(0, 1),
      medium: weatherData.medium.slice(0, 2),
      hard: weatherData.hard.slice(0, 3),
    };
    DAYS.slice(0, 100).forEach((day) => {
      const { tier, poolIndex } = pickDailyWeather(day, small);
      expect(poolIndex).toBeLessThan(small[tier].length);
    });
  });
});

describe("buildWeatherRound", () => {
  it("decodes the puzzle of its tier", () => {
    DIFFICULTIES.forEach((tier) => {
      const round = buildWeatherRound(tier, 3);
      expect(round.tier).toBe(tier);
      expect(round.poolIndex).toBe(3);
      expect(round.puzzle.weather).toHaveLength(TIER_SETTINGS[tier].days);
      expect(round.puzzle.trips).toHaveLength(TIER_SETTINGS[tier].trips);
    });
  });

  it("refuses a puzzle that is not in the pool", () => {
    expect(() => buildWeatherRound("easy", 9999)).toThrow("no easy Weather Window number 9999");
    expect(() => buildWeatherRound("easy", -1)).toThrow();
  });
});

describe("buildDailyWeatherRound and findDailyWeatherRound", () => {
  it("build the puzzle that the daily pick names", () => {
    DAYS.slice(0, 20).forEach((day) => {
      const { tier, poolIndex } = pickDailyWeather(day);
      const round = buildDailyWeatherRound(day);
      expect([round.tier, round.poolIndex]).toEqual([tier, poolIndex]);
      expect(findDailyWeatherRound(day)).toEqual(round);
    });
  });

  it("find nothing, instead of failing, when the data is empty", () => {
    expect(findDailyWeatherRound(0, { easy: [], medium: [], hard: [] })).toBeNull();
  });
});
