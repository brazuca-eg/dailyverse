import type { ElementKind, SceneTheme } from "./types";

export type Zone = "sky" | "mountains" | "hills" | "lake" | "ground";

export interface Recipe {
  kind: ElementKind;
  zone: Zone;
  min: number;
  max: number;
}

export interface ZoneSpec {
  x: readonly [number, number];
  y: readonly [number, number];
  scale: readonly [number, number];
  layer: number;
}

export const SCENE_WIDTH = 800;
export const SCENE_HEIGHT = 600;
export const HORIZON_Y = 330;

export const ZONES: Readonly<Record<Zone, ZoneSpec>> = {
  sky: { x: [40, 760], y: [60, 210], scale: [0.8, 1.15], layer: 1 },
  mountains: { x: [60, 740], y: [325, 340], scale: [0.9, 1.4], layer: 2 },
  hills: { x: [40, 760], y: [385, 420], scale: [1, 1.3], layer: 3 },
  lake: { x: [330, 470], y: [455, 480], scale: [1, 1.35], layer: 4 },
  ground: { x: [30, 770], y: [395, 575], scale: [0.6, 1.3], layer: 5 },
};

export const BIRD_LAYER = 6;

export type Crowd = "sky" | "ground" | "background";

export const CROWD_BY_LAYER: Readonly<Record<number, Crowd>> = {
  1: "sky",
  2: "background",
  3: "background",
  4: "ground",
  5: "ground",
  6: "sky",
};

export const KIND_SCALE: Readonly<Partial<Record<ElementKind, number>>> = {
  flower: 0.8,
  rock: 0.9,
  campfire: 0.9,
  bush: 0.9,
};

export const THEME_COLOURS: Readonly<Record<SceneTheme, { sky: string; ground: string }>> = {
  camp: { sky: "#bfe3f5", ground: "#8bc17d" },
  lake: { sky: "#cfe8f7", ground: "#9acb85" },
  forest: { sky: "#cde9e0", ground: "#6fae6a" },
  alpine: { sky: "#b9d4ee", ground: "#a7c796" },
};

function recipe(kind: ElementKind, zone: Zone, min: number, max: number): Recipe {
  return { kind, zone, min, max };
}

export const THEME_RECIPES: Readonly<Record<SceneTheme, readonly Recipe[]>> = {
  camp: [
    recipe("sun", "sky", 1, 1),
    recipe("mountain", "mountains", 2, 3),
    recipe("hill", "hills", 2, 3),
    recipe("tent", "ground", 2, 3),
    recipe("campfire", "ground", 1, 1),
    recipe("pine", "ground", 6, 9),
    recipe("roundTree", "ground", 3, 5),
    recipe("rock", "ground", 4, 6),
    recipe("bush", "ground", 3, 5),
    recipe("flower", "ground", 9, 13),
    recipe("cloud", "sky", 2, 4),
    recipe("bird", "sky", 2, 4),
  ],
  lake: [
    recipe("sun", "sky", 1, 1),
    recipe("mountain", "mountains", 1, 2),
    recipe("hill", "hills", 2, 2),
    recipe("lake", "lake", 1, 1),
    recipe("tent", "ground", 1, 1),
    recipe("pine", "ground", 5, 7),
    recipe("roundTree", "ground", 4, 6),
    recipe("rock", "ground", 5, 7),
    recipe("bush", "ground", 3, 5),
    recipe("flower", "ground", 9, 13),
    recipe("cloud", "sky", 2, 3),
    recipe("bird", "sky", 3, 5),
  ],
  forest: [
    recipe("sun", "sky", 1, 1),
    recipe("hill", "hills", 2, 3),
    recipe("tent", "ground", 1, 1),
    recipe("pine", "ground", 14, 18),
    recipe("roundTree", "ground", 6, 8),
    recipe("rock", "ground", 4, 6),
    recipe("bush", "ground", 5, 7),
    recipe("flower", "ground", 8, 12),
    recipe("cloud", "sky", 2, 3),
    recipe("bird", "sky", 2, 3),
  ],
  alpine: [
    recipe("sun", "sky", 1, 1),
    recipe("mountain", "mountains", 3, 4),
    recipe("hill", "hills", 1, 2),
    recipe("tent", "ground", 1, 2),
    recipe("campfire", "ground", 0, 1),
    recipe("pine", "ground", 8, 11),
    recipe("rock", "ground", 6, 9),
    recipe("bush", "ground", 2, 3),
    recipe("flower", "ground", 6, 9),
    recipe("cloud", "sky", 3, 4),
    recipe("bird", "sky", 2, 3),
  ],
};
