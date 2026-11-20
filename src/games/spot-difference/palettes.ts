import { mixColours, toGreyColour } from "../../core/colour";
import type { SceneMood, SceneTheme } from "./types";

export interface Palette {
  sky: string;
  ground: string;
  sea: string | null;
  water: string;
  ripple: string;
  pine: string;
  trees: readonly string[];
  bush: string;
  hill: string;
  mountain: string;
  mountainCap: string;
  rock: string;
  trunk: string;
  stem: string;
  flowers: readonly string[];
}

const GREEN_DAY: Palette = {
  sky: "#bfe3f5",
  ground: "#8bc17d",
  sea: null,
  water: "#5aa9e6",
  ripple: "#8cc8f2",
  pine: "#2f7d57",
  trees: ["#4a9a5f"],
  bush: "#3f8f55",
  hill: "#7fb069",
  mountain: "#6f7f99",
  mountainCap: "#f4f7fb",
  rock: "#8d9199",
  trunk: "#7a5230",
  stem: "#4f9a4a",
  flowers: ["#f4a6c0", "#f7f1ff", "#f49a4a"],
};

export const PALETTES: Readonly<Record<SceneTheme, Palette>> = {
  camp: GREEN_DAY,
  lake: { ...GREEN_DAY, sky: "#cfe8f7", ground: "#9acb85" },
  forest: { ...GREEN_DAY, sky: "#cde9e0", ground: "#6fae6a" },
  alpine: { ...GREEN_DAY, sky: "#b9d4ee", ground: "#a7c796" },
  winter: {
    ...GREEN_DAY,
    sky: "#dbe8f2",
    ground: "#eef4f9",
    water: "#b9d9ea",
    ripple: "#e3f1f8",
    pine: "#5f918c",
    trees: ["#9fb4c6", "#b9c9d7"],
    bush: "#a9c1cf",
    hill: "#dde9f1",
    mountain: "#8794ad",
    mountainCap: "#ffffff",
    rock: "#8f98a3",
    flowers: ["#8fb3d9", "#d9b6e8", "#f4a6c0"],
  },
  desert: {
    ...GREEN_DAY,
    sky: "#f3dcbf",
    ground: "#e5c58d",
    pine: "#7d8b4a",
    trees: ["#8f9a4f"],
    bush: "#a09a55",
    hill: "#dcb676",
    mountain: "#bf6f4d",
    mountainCap: "#e7a77d",
    rock: "#a58a73",
    trunk: "#8a5a36",
    stem: "#7f9a4a",
    flowers: ["#f2a03d", "#f4d35e", "#e86a4a"],
  },
  beach: {
    ...GREEN_DAY,
    sky: "#bfe7f4",
    ground: "#f0dba7",
    sea: "#4fb3d9",
    pine: "#3d8a63",
    hill: "#86c27a",
    mountain: "#7b8fa8",
    rock: "#a49d94",
    stem: "#5ba354",
    flowers: ["#ff9fb5", "#fff3c4", "#ffb35a"],
  },
  countryside: {
    ...GREEN_DAY,
    sky: "#c9e6f5",
    ground: "#a9cf72",
    pine: "#2f7a52",
    trees: ["#5ba354", "#6fb35a"],
    hill: "#93c26c",
    mountain: "#7f93ad",
    rock: "#9a9b95",
    flowers: ["#f7f1ff", "#f4d35e", "#e86a8a"],
  },
  autumn: {
    ...GREEN_DAY,
    sky: "#cfe0ec",
    ground: "#b9b36a",
    pine: "#2e6a4d",
    trees: ["#e0742f", "#d1492e", "#e8b030"],
    bush: "#a8683a",
    hill: "#c9a85c",
    mountain: "#7c7a8f",
    rock: "#8d8a86",
    trunk: "#6d4727",
    stem: "#8a8a3f",
    flowers: ["#f2a03d", "#d9534f", "#f4d35e"],
  },
};

export const MOOD_SHADE_BOOST: Readonly<Record<SceneMood, number>> = {
  day: 1,
  sunrise: 1,
  sunset: 1.2,
  overcast: 1.7,
  night: 2.6,
};

export const MOOD_WEIGHTS: Readonly<Record<SceneMood, number>> = {
  day: 35,
  sunrise: 15,
  sunset: 20,
  overcast: 15,
  night: 15,
};

const SKY_BANDS: Readonly<Record<Exclude<SceneMood, "day">, readonly string[]>> = {
  sunrise: ["#f2b6a0", "#f7cfa8", "#fbe3b8"],
  sunset: ["#b9739b", "#ee9a6c", "#f7c283"],
  overcast: ["#aeb7c0", "#c4ccd3"],
  night: ["#0f1a38", "#1a2a52", "#27396b"],
};

export function listSkyBands(theme: SceneTheme, mood: SceneMood): readonly string[] {
  return mood === "day" ? [PALETTES[theme].sky] : SKY_BANDS[mood];
}

export function tintColour(hex: string, mood: SceneMood): string {
  switch (mood) {
    case "day":
      return hex;
    case "sunrise":
      return mixColours(hex, "#ffb38a", 0.22);
    case "sunset":
      return mixColours(mixColours(hex, "#ff8a4f", 0.28), "#3a1f33", 0.08);
    case "overcast":
      return mixColours(mixColours(hex, toGreyColour(hex), 0.5), "#cfd6dd", 0.12);
    case "night":
      return mixColours(hex, "#1a2547", 0.48);
  }
}
