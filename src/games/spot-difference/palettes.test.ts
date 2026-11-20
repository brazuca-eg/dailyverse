import { describe, expect, it } from "vitest";
import { calculateContrast } from "../../testing/contrast";
import { MOOD_SHADE_BOOST, MOOD_WEIGHTS, PALETTES, listSkyBands, tintColour } from "./palettes";
import { MOODS, THEMES } from "./types";

function measureDistance(first: string, second: string): number {
  return [1, 3, 5].reduce(
    (sum, start) =>
      sum +
      Math.abs(
        parseInt(first.slice(start, start + 2), 16) - parseInt(second.slice(start, start + 2), 16),
      ),
    0,
  );
}

describe("PALETTES", () => {
  it("has colours for every theme, all written as hex", () => {
    THEMES.forEach((theme) => {
      const palette = PALETTES[theme];
      [
        palette.sky,
        palette.ground,
        palette.water,
        palette.pine,
        palette.bush,
        palette.hill,
        palette.mountain,
        palette.rock,
        palette.trunk,
        ...palette.trees,
        ...palette.flowers,
      ].forEach((colour) => expect(colour).toMatch(/^#[0-9a-f]{6}$/i));
      expect(palette.trees.length).toBeGreaterThan(0);
      expect(palette.flowers.length).toBeGreaterThan(0);
    });
  });

  it("gives only the beach a sea", () => {
    expect(THEMES.filter((theme) => PALETTES[theme].sea !== null)).toEqual(["beach"]);
  });

  it("looks different from place to place", () => {
    const looks = THEMES.map((theme) => `${PALETTES[theme].sky}${PALETTES[theme].ground}`);
    expect(new Set(looks).size).toBe(THEMES.length);
  });

  it("keeps the flowers visible on the ground of their place", () => {
    THEMES.forEach((theme) => {
      PALETTES[theme].flowers.forEach((flower) => {
        expect(measureDistance(flower, PALETTES[theme].ground)).toBeGreaterThanOrEqual(60);
      });
    });
  });
});

describe("listSkyBands", () => {
  it("is one plain sky by day, and bands for the other times of day", () => {
    THEMES.forEach((theme) => expect(listSkyBands(theme, "day")).toEqual([PALETTES[theme].sky]));
    expect(listSkyBands("camp", "sunset")).toHaveLength(3);
    expect(listSkyBands("camp", "overcast")).toHaveLength(2);
  });

  it("makes the night sky darker than the day sky", () => {
    const [first] = listSkyBands("camp", "night");
    expect(calculateContrast(first, "#000000")).toBeLessThan(
      calculateContrast(PALETTES.camp.sky, "#000000"),
    );
  });
});

describe("tintColour", () => {
  it("leaves a colour as it is by day", () => {
    expect(tintColour("#4a9a5f", "day")).toBe("#4a9a5f");
  });

  it("darkens at night and takes the colour out under cloud", () => {
    const night = tintColour("#ffffff", "night");
    expect(calculateContrast(night, "#000000")).toBeLessThan(
      calculateContrast("#ffffff", "#000000"),
    );
    const overcast = tintColour("#ff0000", "overcast");
    const [red, green] = [1, 3].map((start) => parseInt(overcast.slice(start, start + 2), 16));
    expect(red - green).toBeLessThan(255 - 0);
    expect(red - green).toBeLessThan(120);
  });

  it("warms the colours at sunrise and sunset", () => {
    ["sunrise", "sunset"].forEach((mood) => {
      const tinted = tintColour("#4a9a5f", mood as "sunrise" | "sunset");
      expect(parseInt(tinted.slice(1, 3), 16)).toBeGreaterThan(0x4a);
    });
  });

  it("gives a valid colour for every mood", () => {
    MOODS.forEach((mood) => expect(tintColour("#3f8f55", mood)).toMatch(/^#[0-9a-f]{6}$/));
  });
});

describe("mood tables", () => {
  it("have an entry for every mood", () => {
    MOODS.forEach((mood) => {
      expect(MOOD_WEIGHTS[mood]).toBeGreaterThan(0);
      expect(MOOD_SHADE_BOOST[mood]).toBeGreaterThanOrEqual(1);
    });
  });

  it("make the colour steps bigger where the light hides them", () => {
    expect(MOOD_SHADE_BOOST.night).toBeGreaterThan(MOOD_SHADE_BOOST.overcast);
    expect(MOOD_SHADE_BOOST.overcast).toBeGreaterThan(MOOD_SHADE_BOOST.day);
  });
});
