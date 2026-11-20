import type { ElementKind, SceneTheme } from "./types";

export type Zone = "sky" | "mountains" | "hills" | "lake" | "water" | "sea" | "ground";

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
export const SEA_DEPTH = 62;

export const ZONES: Readonly<Record<Zone, ZoneSpec>> = {
  sky: { x: [40, 760], y: [60, 210], scale: [0.8, 1.15], layer: 1 },
  mountains: { x: [60, 740], y: [325, 340], scale: [0.9, 1.4], layer: 2 },
  hills: { x: [40, 760], y: [385, 420], scale: [1, 1.3], layer: 3 },
  lake: { x: [330, 470], y: [455, 480], scale: [1, 1.35], layer: 4 },
  water: { x: [290, 510], y: [452, 486], scale: [0.7, 0.95], layer: 5 },
  sea: { x: [80, 720], y: [352, 376], scale: [0.7, 0.9], layer: 5 },
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
  cactus: 1.2,
  palm: 1.15,
  cabin: 1.35,
  barn: 1.4,
  windmill: 1.3,
  haybale: 0.9,
  deer: 0.85,
  rabbit: 0.9,
  mushroom: 0.85,
  balloon: 1.2,
  snowman: 1,
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
    recipe("backpack", "ground", 0, 1),
    recipe("signpost", "ground", 0, 1),
    recipe("cabin", "ground", 0, 1),
    recipe("deer", "ground", 0, 1),
    recipe("rabbit", "ground", 0, 2),
    recipe("mushroom", "ground", 0, 2),
    recipe("balloon", "sky", 0, 1),
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
    recipe("boat", "water", 0, 1),
    recipe("duck", "water", 1, 3),
    recipe("cabin", "ground", 0, 1),
    recipe("rabbit", "ground", 0, 1),
    recipe("signpost", "ground", 0, 1),
    recipe("balloon", "sky", 0, 1),
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
    recipe("cabin", "ground", 0, 1),
    recipe("deer", "ground", 1, 2),
    recipe("rabbit", "ground", 0, 2),
    recipe("mushroom", "ground", 2, 4),
    recipe("signpost", "ground", 0, 1),
    recipe("backpack", "ground", 0, 1),
    recipe("cloud", "sky", 2, 3),
    recipe("bird", "sky", 2, 3),
  ],
  winter: [
    recipe("sun", "sky", 1, 1),
    recipe("mountain", "mountains", 2, 3),
    recipe("hill", "hills", 2, 2),
    recipe("lake", "lake", 0, 1),
    recipe("tent", "ground", 1, 2),
    recipe("campfire", "ground", 1, 1),
    recipe("pine", "ground", 12, 16),
    recipe("roundTree", "ground", 2, 3),
    recipe("rock", "ground", 5, 7),
    recipe("bush", "ground", 4, 6),
    recipe("flower", "ground", 4, 6),
    recipe("cabin", "ground", 0, 1),
    recipe("snowman", "ground", 1, 2),
    recipe("deer", "ground", 0, 1),
    recipe("rabbit", "ground", 0, 1),
    recipe("cloud", "sky", 3, 4),
    recipe("bird", "sky", 1, 2),
  ],
  desert: [
    recipe("sun", "sky", 1, 1),
    recipe("mountain", "mountains", 2, 3),
    recipe("hill", "hills", 2, 2),
    recipe("tent", "ground", 1, 2),
    recipe("campfire", "ground", 0, 1),
    recipe("cactus", "ground", 8, 11),
    recipe("rock", "ground", 8, 11),
    recipe("bush", "ground", 4, 6),
    recipe("flower", "ground", 6, 9),
    recipe("signpost", "ground", 0, 1),
    recipe("backpack", "ground", 0, 1),
    recipe("cloud", "sky", 1, 2),
    recipe("bird", "sky", 2, 3),
  ],
  beach: [
    recipe("sun", "sky", 1, 1),
    recipe("hill", "hills", 1, 2),
    recipe("tent", "ground", 1, 2),
    recipe("campfire", "ground", 1, 1),
    recipe("palm", "ground", 6, 9),
    recipe("roundTree", "ground", 1, 2),
    recipe("rock", "ground", 6, 8),
    recipe("bush", "ground", 4, 6),
    recipe("flower", "ground", 8, 11),
    recipe("boat", "sea", 1, 2),
    recipe("umbrella", "ground", 2, 3),
    recipe("backpack", "ground", 0, 1),
    recipe("cloud", "sky", 2, 3),
    recipe("bird", "sky", 3, 5),
  ],
  autumn: [
    recipe("sun", "sky", 1, 1),
    recipe("mountain", "mountains", 1, 2),
    recipe("hill", "hills", 2, 3),
    recipe("lake", "lake", 0, 1),
    recipe("tent", "ground", 1, 2),
    recipe("campfire", "ground", 0, 1),
    recipe("pine", "ground", 4, 6),
    recipe("roundTree", "ground", 9, 12),
    recipe("rock", "ground", 3, 5),
    recipe("bush", "ground", 4, 6),
    recipe("flower", "ground", 3, 5),
    recipe("cabin", "ground", 0, 1),
    recipe("deer", "ground", 0, 1),
    recipe("rabbit", "ground", 0, 2),
    recipe("mushroom", "ground", 2, 4),
    recipe("haybale", "ground", 0, 2),
    recipe("fence", "ground", 0, 1),
    recipe("cloud", "sky", 2, 3),
    recipe("bird", "sky", 2, 4),
  ],
  countryside: [
    recipe("sun", "sky", 1, 1),
    recipe("mountain", "mountains", 0, 1),
    recipe("hill", "hills", 2, 3),
    recipe("barn", "ground", 1, 1),
    recipe("windmill", "ground", 0, 1),
    recipe("haybale", "ground", 2, 4),
    recipe("fence", "ground", 3, 5),
    recipe("roundTree", "ground", 4, 6),
    recipe("pine", "ground", 1, 2),
    recipe("tent", "ground", 0, 1),
    recipe("rock", "ground", 2, 3),
    recipe("bush", "ground", 3, 4),
    recipe("flower", "ground", 8, 12),
    recipe("deer", "ground", 0, 1),
    recipe("rabbit", "ground", 0, 2),
    recipe("signpost", "ground", 0, 1),
    recipe("balloon", "sky", 0, 1),
    recipe("cloud", "sky", 2, 3),
    recipe("bird", "sky", 2, 4),
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
    recipe("cabin", "ground", 1, 1),
    recipe("signpost", "ground", 0, 1),
    recipe("deer", "ground", 0, 1),
    recipe("backpack", "ground", 0, 1),
    recipe("cloud", "sky", 3, 4),
    recipe("bird", "sky", 2, 3),
  ],
};
