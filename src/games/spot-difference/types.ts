import type { Difficulty } from "../../core/difficulty";

export const ELEMENT_KINDS = [
  "sun",
  "cloud",
  "bird",
  "mountain",
  "hill",
  "lake",
  "pine",
  "roundTree",
  "bush",
  "tent",
  "campfire",
  "rock",
  "flower",
  "cactus",
  "palm",
  "cabin",
  "barn",
  "windmill",
  "haybale",
  "fence",
  "boat",
  "duck",
  "deer",
  "rabbit",
  "mushroom",
  "signpost",
  "backpack",
  "snowman",
  "balloon",
  "umbrella",
] as const;

export type ElementKind = (typeof ELEMENT_KINDS)[number];

export const THEMES = [
  "camp",
  "lake",
  "forest",
  "alpine",
  "winter",
  "desert",
  "beach",
  "autumn",
  "countryside",
] as const;

export type SceneTheme = (typeof THEMES)[number];

export const MOODS = ["day", "sunrise", "sunset", "overcast", "night"] as const;

export type SceneMood = (typeof MOODS)[number];

export interface SceneElement {
  id: string;
  kind: ElementKind;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  shade: number;
  variant: number;
  layer: number;
  flip?: boolean;
}

export interface Scene {
  seed: number;
  theme: SceneTheme;
  mood: SceneMood;
  width: number;
  height: number;
  elements: SceneElement[];
}

interface Glowing {
  glow?: boolean;
}

export type Primitive =
  | ({ shape: "rect"; x: number; y: number; width: number; height: number; fill: string } & Glowing)
  | ({
      shape: "circle";
      cx: number;
      cy: number;
      r: number;
      fill: string;
      opacity?: number;
    } & Glowing)
  | ({ shape: "ellipse"; cx: number; cy: number; rx: number; ry: number; fill: string } & Glowing)
  | ({
      shape: "polygon";
      points: readonly (readonly [number, number])[];
      fill: string;
    } & Glowing);

export interface Bounds {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export const DIFFERENCE_KINDS = [
  "remove",
  "add",
  "move",
  "resize",
  "reshade",
  "revariant",
  "mirror",
] as const;

export type DifferenceKind = (typeof DIFFERENCE_KINDS)[number];

export interface Difference {
  id: string;
  kind: DifferenceKind;
  region: Bounds;
}

export interface Puzzle {
  seed: number;
  tier: Difficulty;
  original: Scene;
  altered: Scene;
  differences: Difference[];
}
