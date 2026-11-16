import { createRandom, hashSeed, type Random } from "../../core/random";
import { VARIANT_COUNTS } from "./elements";
import { boundsOverlap, isInside, measureElement } from "./geometry";
import {
  BIRD_LAYER,
  CROWD_BY_LAYER,
  KIND_SCALE,
  SCENE_HEIGHT,
  SCENE_WIDTH,
  THEME_RECIPES,
  ZONES,
  type Recipe,
  type Zone,
} from "./recipes";
import { THEMES, type Scene, type SceneElement } from "./types";

const PLACEMENT_ATTEMPTS = 80;
const SPACING = 4;
const EDGE_MARGIN = 6;
const SHADES = [-1, 0, 1] as const;
const SLOTTED_ZONES: readonly Zone[] = ["mountains", "hills"];
const CROWDED_ZONES: readonly Zone[] = ["sky", "ground", "lake"];

interface Slot {
  recipe: Recipe;
  index: number;
  count: number;
}

function between(random: Random, [low, high]: readonly [number, number]): number {
  return low + random() * (high - low);
}

function drawInteger(random: Random, min: number, max: number): number {
  return min + Math.floor(random() * (max - min + 1));
}

function round(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function planSlots(random: Random, recipes: readonly Recipe[]): Slot[] {
  return recipes.flatMap((recipe) => {
    const count = drawInteger(random, recipe.min, recipe.max);
    return Array.from({ length: count }, (_, index) => ({ recipe, index, count }));
  });
}

function chooseScale(random: Random, recipe: Recipe, y: number): number {
  const zone = ZONES[recipe.zone];
  const kindScale = KIND_SCALE[recipe.kind] ?? 1;
  if (recipe.zone === "ground") {
    const [low, high] = zone.scale;
    const depth = (y - zone.y[0]) / (zone.y[1] - zone.y[0]);
    return round((low + depth * (high - low)) * kindScale, 2);
  }
  return round(between(random, zone.scale) * kindScale, 2);
}

function chooseX(random: Random, slot: Slot): number {
  const { x } = ZONES[slot.recipe.zone];
  if (SLOTTED_ZONES.includes(slot.recipe.zone)) {
    const share = (slot.index + 0.2 + 0.6 * random()) / slot.count;
    return round(x[0] + share * (x[1] - x[0]), 1);
  }
  return round(between(random, x), 1);
}

function proposeElement(random: Random, slot: Slot): SceneElement {
  const { recipe } = slot;
  const zone = ZONES[recipe.zone];
  const y = round(between(random, zone.y), 1);
  return {
    id: "",
    kind: recipe.kind,
    x: chooseX(random, slot),
    y,
    scale: chooseScale(random, recipe, y),
    rotation: 0,
    shade: SHADES[drawInteger(random, 0, SHADES.length - 1)],
    variant: drawInteger(random, 0, VARIANT_COUNTS[recipe.kind] - 1),
    layer: recipe.kind === "bird" ? BIRD_LAYER : zone.layer,
  };
}

function isFree(candidate: SceneElement, placed: readonly SceneElement[], zone: Zone): boolean {
  const bounds = measureElement(candidate);
  if (!CROWDED_ZONES.includes(zone)) {
    return true;
  }
  const rivals = placed.filter((element) => isSameCrowd(element, candidate));
  return (
    isInside(bounds, SCENE_WIDTH, SCENE_HEIGHT, EDGE_MARGIN) &&
    rivals.every((element) => !boundsOverlap(bounds, measureElement(element), SPACING))
  );
}

function isSameCrowd(element: SceneElement, candidate: SceneElement): boolean {
  const crowd = CROWD_BY_LAYER[element.layer];
  return crowd !== "background" && crowd === CROWD_BY_LAYER[candidate.layer];
}

function placeSlot(
  random: Random,
  slot: Slot,
  placed: readonly SceneElement[],
): SceneElement | null {
  const attempts = Array.from({ length: PLACEMENT_ATTEMPTS }, () => proposeElement(random, slot));
  return attempts.find((candidate) => isFree(candidate, placed, slot.recipe.zone)) ?? null;
}

function assignIds(elements: readonly SceneElement[]): SceneElement[] {
  const counters = new Map<string, number>();
  return elements.map((element) => {
    const next = (counters.get(element.kind) ?? 0) + 1;
    counters.set(element.kind, next);
    return { ...element, id: `${element.kind}-${next}` };
  });
}

export function sortForDrawing(elements: readonly SceneElement[]): SceneElement[] {
  return [...elements].sort(
    (a, b) => a.layer - b.layer || a.y - b.y || a.x - b.x || a.id.localeCompare(b.id),
  );
}

export function generateScene(seed: number): Scene {
  const random = createRandom(hashSeed(seed));
  const theme = THEMES[drawInteger(random, 0, THEMES.length - 1)];
  const slots = planSlots(random, THEME_RECIPES[theme]);
  const placed = slots.reduce<SceneElement[]>((elements, slot) => {
    const element = placeSlot(random, slot, elements);
    return element ? [...elements, element] : elements;
  }, []);
  return {
    seed,
    theme,
    width: SCENE_WIDTH,
    height: SCENE_HEIGHT,
    elements: sortForDrawing(assignIds(placed)),
  };
}
