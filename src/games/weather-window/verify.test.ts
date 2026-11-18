import { describe, expect, it } from "vitest";
import { weatherData, type WeatherData } from "./data";
import { verifyWeatherData } from "./verify";

function withEasy(first: unknown): WeatherData {
  return {
    ...weatherData,
    easy: [first as WeatherData["easy"][number], ...weatherData.easy.slice(1)],
  };
}

describe("verifyWeatherData", () => {
  it("finds nothing wrong with the shipped puzzles", () => {
    expect(verifyWeatherData(weatherData)).toEqual([]);
  });

  it("reports a pool that is too small", () => {
    const issues = verifyWeatherData({ ...weatherData, hard: weatherData.hard.slice(0, 5) });
    expect(issues).toContain("hard: only 5 puzzles, need 210");
  });

  it("reports a duplicate puzzle", () => {
    const issues = verifyWeatherData(withEasy(weatherData.easy[1]));
    expect(issues).toContain("easy #1: duplicate puzzle");
    expect(issues).toHaveLength(1);
  });

  it("reports a forecast of the wrong length or with unknown weather", () => {
    const [first] = weatherData.easy;
    expect(verifyWeatherData(withEasy({ ...first, w: first.w.slice(1) }))[0]).toBe(
      "easy #0: invalid forecast or trips",
    );
    expect(verifyWeatherData(withEasy({ ...first, w: [9, ...first.w.slice(1)] }))[0]).toBe(
      "easy #0: invalid forecast or trips",
    );
  });

  it("reports trips that are unknown, repeated or too few", () => {
    const [first] = weatherData.easy;
    ["[0,0]", "[0,9]", "[0]"].forEach((trips) => {
      expect(verifyWeatherData(withEasy({ ...first, t: JSON.parse(trips) }))[0]).toBe(
        "easy #0: invalid forecast or trips",
      );
    });
  });

  it("reports a puzzle without a clear best plan", () => {
    const issues = verifyWeatherData(withEasy({ w: [0, 1, 2, 3, 4], t: [0, 1] }));
    expect(issues).toEqual(["easy #0: does not have a clear best plan that needs memory"]);
  });
});
