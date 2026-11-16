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
] as const;

export type ElementKind = (typeof ELEMENT_KINDS)[number];

export const THEMES = ["camp", "lake", "forest", "alpine"] as const;

export type SceneTheme = (typeof THEMES)[number];

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
}

export interface Scene {
  seed: number;
  theme: SceneTheme;
  width: number;
  height: number;
  elements: SceneElement[];
}

export type Primitive =
  | { shape: "rect"; x: number; y: number; width: number; height: number; fill: string }
  | { shape: "circle"; cx: number; cy: number; r: number; fill: string; opacity?: number }
  | { shape: "ellipse"; cx: number; cy: number; rx: number; ry: number; fill: string }
  | { shape: "polygon"; points: readonly (readonly [number, number])[]; fill: string };

export interface Bounds {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export const DIFFERENCE_KINDS = ["remove", "move", "resize", "reshade", "revariant"] as const;

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
