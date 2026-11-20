import type { Difficulty } from "../../core/difficulty";
import { shuffle, type Random } from "../../core/random";
import { DIFFERENCE_COUNT, TIER_PROFILES, type TierProfile } from "./difficulty";
import { VARIANT_COUNTS, drawElement, type DrawContext } from "./elements";
import { boundsOverlap, isInside, measureElement, measureParts } from "./geometry";
import { MOOD_SHADE_BOOST, PALETTES } from "./palettes";
import { CROWD_BY_LAYER, SCENE_HEIGHT, SCENE_WIDTH } from "./recipes";
import { sortForDrawing } from "./scene";
import {
  DIFFERENCE_KINDS,
  type Bounds,
  type Difference,
  type DifferenceKind,
  type ElementKind,
  type Scene,
  type SceneElement,
} from "./types";

const EDGE_MARGIN = 24;
const REGION_PADDING = 6;
const REGION_GAP = 16;
const NEIGHBOUR_SPACING = 2;
const MAX_PER_KIND = 2;
const ALTERATION_ATTEMPTS = 8;
const MIN_SHAPE_CHANGE_AREA = 400;
const MIN_RESIZE_GAIN = 30;
const FLOWER_PETAL_STYLES = 4;
const TENT_FLAP_OFFSET = 3;
const TENT_VARIANTS = 6;
const ROUND_TREE_NEXT_VARIANT: readonly number[] = [1, 2, 1];

const REMOVABLE: readonly ElementKind[] = [
  "flower",
  "rock",
  "bush",
  "bird",
  "cloud",
  "roundTree",
  "pine",
  "tent",
  "campfire",
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
];

export const ELIGIBLE_KINDS: Readonly<Record<DifferenceKind, readonly ElementKind[]>> = {
  remove: REMOVABLE,
  add: REMOVABLE,
  move: REMOVABLE.filter((kind) => kind !== "campfire"),
  resize: REMOVABLE,
  reshade: [
    "pine",
    "roundTree",
    "bush",
    "tent",
    "rock",
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
    "balloon",
    "umbrella",
  ],
  revariant: [
    "pine",
    "roundTree",
    "tent",
    "campfire",
    "flower",
    "cloud",
    "bird",
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
  ],
  mirror: ["palm", "cabin", "boat", "duck", "deer", "rabbit", "signpost", "backpack"],
};

interface Change {
  original: SceneElement;
  altered: SceneElement | null;
  kind: DifferenceKind;
  region: Bounds;
}

export interface DifferencePlan {
  original: Scene;
  altered: Scene;
  differences: Difference[];
}

function between(random: Random, [low, high]: readonly [number, number]): number {
  return low + random() * (high - low);
}

function round(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function pickSign(random: Random): number {
  return random() < 0.5 ? -1 : 1;
}

function nextVariant(element: SceneElement): number {
  const { variant, kind } = element;
  if (kind === "flower") {
    const style = Math.floor(variant / FLOWER_PETAL_STYLES) * FLOWER_PETAL_STYLES;
    return style + (((variant % FLOWER_PETAL_STYLES) + 1) % FLOWER_PETAL_STYLES);
  }
  if (kind === "tent") {
    return (variant + TENT_FLAP_OFFSET) % TENT_VARIANTS;
  }
  if (kind === "roundTree") {
    return ROUND_TREE_NEXT_VARIANT[variant];
  }
  return (variant + 1) % VARIANT_COUNTS[kind];
}

export function alterElement(
  element: SceneElement,
  kind: DifferenceKind,
  profile: TierProfile,
  random: Random,
): SceneElement | null {
  switch (kind) {
    case "remove":
    case "add":
      return null;
    case "mirror":
      return { ...element, flip: !element.flip };
    case "move": {
      const angle = random() * 2 * Math.PI;
      const distance = between(random, profile.moveDistance);
      return {
        ...element,
        x: round(element.x + Math.cos(angle) * distance, 1),
        y: round(element.y + Math.sin(angle) * distance, 1),
      };
    }
    case "resize": {
      const share = between(random, profile.resizeShare);
      return { ...element, scale: round(element.scale * (1 + pickSign(random) * share), 2) };
    }
    case "reshade":
      return { ...element, shade: element.shade + pickSign(random) * profile.shadeSteps };
    case "revariant":
      return { ...element, variant: nextVariant(element) };
  }
}

function mergeBounds(first: Bounds, second: Bounds): Bounds {
  return {
    left: Math.min(first.left, second.left) - REGION_PADDING,
    top: Math.min(first.top, second.top) - REGION_PADDING,
    right: Math.max(first.right, second.right) + REGION_PADDING,
    bottom: Math.max(first.bottom, second.bottom) + REGION_PADDING,
  };
}

function pad(bounds: Bounds): Bounds {
  return mergeBounds(bounds, bounds);
}

function unionBounds(boundsList: readonly Bounds[]): Bounds {
  return boundsList.reduce((merged, bounds) => mergeBounds(merged, bounds), boundsList[0]);
}

function readContext(scene: Scene): DrawContext {
  return { palette: PALETTES[scene.theme], mood: scene.mood };
}

function findChangedParts(before: SceneElement, after: SceneElement, context: DrawContext): Bounds {
  const oldParts = drawElement(before, context);
  const newParts = drawElement(after, context);
  const key = (part: unknown) => JSON.stringify(part);
  const oldKeys = new Set(oldParts.map(key));
  const newKeys = new Set(newParts.map(key));
  const removed = oldParts.filter((part) => !newKeys.has(key(part)));
  const added = newParts.filter((part) => !oldKeys.has(key(part)));
  const changed = [
    ...(removed.length > 0 ? [measureParts(before, removed)] : []),
    ...(added.length > 0 ? [measureParts(after, added)] : []),
  ];
  return changed.length > 0 ? unionBounds(changed) : pad(measureElement(before));
}

function measureArea(bounds: Bounds): number {
  return (bounds.right - bounds.left) * (bounds.bottom - bounds.top);
}

function isHiddenBehind(element: SceneElement, scene: Scene): boolean {
  const bounds = measureElement(element);
  return scene.elements.some(
    (other) =>
      other.layer > element.layer &&
      CROWD_BY_LAYER[other.layer] === "background" &&
      boundsOverlap(bounds, measureElement(other)),
  );
}

const FAINT_BOOST = 1.7;

function isSymmetric(element: SceneElement, kind: DifferenceKind): boolean {
  if (kind !== "mirror") {
    return false;
  }
  return (
    (element.kind === "boat" && element.variant !== 2) ||
    (element.kind === "signpost" && element.variant !== 0)
  );
}

function isTooFaint(element: SceneElement, kind: DifferenceKind, scene: Scene): boolean {
  const isDim = MOOD_SHADE_BOOST[scene.mood] >= FAINT_BOOST;
  const isThin = scene.mood === "night" && element.kind === "fence";
  return isThin || (isDim && element.kind === "flower" && kind === "revariant");
}

function isCandidate(
  element: SceneElement,
  kind: DifferenceKind,
  profile: TierProfile,
  scene: Scene,
): boolean {
  const bounds = measureElement(element);
  const area = measureArea(bounds);
  return (
    ELIGIBLE_KINDS[kind].includes(element.kind) &&
    !isTooFaint(element, kind, scene) &&
    !isSymmetric(element, kind) &&
    (kind !== "resize" ||
      (area * profile.resizeShare[0]) / MOOD_SHADE_BOOST[scene.mood] >= MIN_RESIZE_GAIN) &&
    area >= profile.minTargetArea &&
    area <= profile.maxTargetArea &&
    (kind !== "revariant" || area >= MIN_SHAPE_CHANGE_AREA) &&
    isInside(bounds, SCENE_WIDTH, SCENE_HEIGHT, EDGE_MARGIN) &&
    !isHiddenBehind(element, scene)
  );
}

function collidesWithNeighbour(altered: SceneElement, scene: Scene): boolean {
  const crowd = CROWD_BY_LAYER[altered.layer];
  const bounds = measureElement(altered);
  return scene.elements.some(
    (other) =>
      other.id !== altered.id &&
      CROWD_BY_LAYER[other.layer] === crowd &&
      boundsOverlap(bounds, measureElement(other), NEIGHBOUR_SPACING),
  );
}

function isSeparated(region: Bounds, taken: readonly Change[]): boolean {
  return taken.every((change) => !boundsOverlap(region, change.region, REGION_GAP));
}

function findRegion(
  element: SceneElement,
  altered: SceneElement | null,
  kind: DifferenceKind,
  before: Bounds,
  context: DrawContext,
): Bounds {
  if (altered === null) {
    return pad(before);
  }
  return kind === "revariant"
    ? findChangedParts(element, altered, context)
    : mergeBounds(before, measureElement(altered));
}

function tryAlteration(
  element: SceneElement,
  kind: DifferenceKind,
  profile: TierProfile,
  scene: Scene,
  taken: readonly Change[],
  random: Random,
): Change | null {
  const before = measureElement(element);
  const attempts = Array.from({ length: ALTERATION_ATTEMPTS }, () =>
    alterElement(element, kind, profile, random),
  );
  const found = attempts
    .map((altered): Change => {
      return {
        original: element,
        altered,
        kind,
        region: findRegion(element, altered, kind, before, readContext(scene)),
      };
    })
    .find(
      (change) =>
        isSeparated(change.region, taken) &&
        (change.altered === null ||
          (isInside(measureElement(change.altered), SCENE_WIDTH, SCENE_HEIGHT, EDGE_MARGIN) &&
            !collidesWithNeighbour(change.altered, scene))),
    );
  return found ?? null;
}

function drawKinds(random: Random): DifferenceKind[] {
  const pool = DIFFERENCE_KINDS.flatMap((kind) => Array.from({ length: MAX_PER_KIND }, () => kind));
  return shuffle(pool, random).slice(0, DIFFERENCE_COUNT);
}

function chooseNext(
  scene: Scene,
  kind: DifferenceKind,
  profile: TierProfile,
  taken: readonly Change[],
  random: Random,
): Change | null {
  const usedIds = new Set(taken.map((change) => change.original.id));
  const candidates = shuffle(
    scene.elements.filter(
      (element) => !usedIds.has(element.id) && isCandidate(element, kind, profile, scene),
    ),
    random,
  );
  const options = candidates.map((element) =>
    tryAlteration(element, kind, profile, scene, taken, random),
  );
  return options.find((change) => change !== null) ?? null;
}

function dropElements(scene: Scene, ids: ReadonlySet<string>): Scene {
  return { ...scene, elements: scene.elements.filter((element) => !ids.has(element.id)) };
}

function applyChanges(scene: Scene, allChanges: readonly Change[]): Scene {
  const changes = allChanges.filter((change) => change.kind !== "add");
  const byId = new Map(changes.map((change) => [change.original.id, change.altered]));
  const elements = scene.elements.flatMap((element) => {
    if (!byId.has(element.id)) {
      return [element];
    }
    const altered = byId.get(element.id);
    return altered ? [altered] : [];
  });
  return { ...scene, elements: sortForDrawing(elements) };
}

export function planDifferences(
  scene: Scene,
  tier: Difficulty,
  random: Random,
): DifferencePlan | null {
  const base = TIER_PROFILES[tier];
  const profile = {
    ...base,
    shadeSteps: Math.round(base.shadeSteps * MOOD_SHADE_BOOST[scene.mood]),
  };
  const changes = drawKinds(random).reduce<Change[] | null>((taken, kind) => {
    if (taken === null) {
      return null;
    }
    const next = chooseNext(scene, kind, profile, taken, random);
    return next ? [...taken, next] : null;
  }, []);
  if (changes === null) {
    return null;
  }
  const added = new Set(
    changes.filter((change) => change.kind === "add").map((change) => change.original.id),
  );
  return {
    original: dropElements(scene, added),
    altered: applyChanges(scene, changes),
    differences: changes.map((change) => ({
      id: change.original.id,
      kind: change.kind,
      region: change.region,
    })),
  };
}
