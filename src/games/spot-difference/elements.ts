import { shadeColour } from "../../core/colour";
import { EXTRA_DRAWERS } from "./extras";
import { PALETTES, type Palette } from "./palettes";
import type { ElementKind, Primitive, SceneElement, SceneMood } from "./types";

type Point = readonly [number, number];

const CLOUD_WHITE = "#ffffff";
const SUN_YELLOW = "#f7c948";
const BIRD_DARK = "#3a3f4a";
const FLAME_ORANGE = "#f08a24";
const FLAME_YELLOW = "#f9d44a";
const LOG_BROWN = "#6b4423";

export const TENT_COLOURS: readonly string[] = ["#e07a3f", "#d9534f", "#2f9aa3"];
const CACTUS_GREEN = "#3f8a4f";
const OVERCAST_SUN = "#efe6bd";
const MOON_GREY = "#e8ecf5";
const CRATER_GREY = "#c4cbdc";
const NIGHT_BIRD = "#cdd6ee";
const PALM_LEAF = "#2f9a57";
const COCONUT_BROWN = "#6b4423";

export interface DrawContext {
  palette: Palette;
  mood: SceneMood;
}

export const DEFAULT_CONTEXT: DrawContext = { palette: PALETTES.camp, mood: "day" };

type Drawer = (element: SceneElement, context: DrawContext) => Primitive[];

const ROCK_OUTLINES: readonly (readonly Point[])[] = [
  [
    [-22, 0],
    [-16, -14],
    [0, -20],
    [16, -12],
    [24, 0],
  ],
  [
    [-18, 0],
    [-20, -10],
    [-6, -20],
    [10, -16],
    [22, -4],
    [20, 0],
  ],
  [
    [-26, 0],
    [-12, -12],
    [4, -14],
    [18, -8],
    [26, 0],
  ],
];

const BIRD_WINGS: readonly (readonly Point[])[] = [
  [
    [-16, 0],
    [-8, -8],
    [0, -2],
    [8, -8],
    [16, 0],
    [8, -4],
    [0, 4],
    [-8, -4],
  ],
  [
    [-16, -6],
    [-8, -12],
    [0, -2],
    [8, -12],
    [16, -6],
    [8, -2],
    [0, 4],
    [-8, -2],
  ],
];

export const VARIANT_COUNTS: Readonly<Record<ElementKind, number>> = {
  sun: 1,
  cloud: 2,
  bird: 2,
  mountain: 2,
  hill: 1,
  lake: 1,
  pine: 3,
  roundTree: 3,
  bush: 2,
  tent: 6,
  campfire: 2,
  rock: 3,
  flower: 12,
  cactus: 3,
  palm: 2,
  cabin: 2,
  barn: 2,
  windmill: 2,
  haybale: 2,
  fence: 2,
  boat: 3,
  duck: 2,
  deer: 2,
  rabbit: 2,
  mushroom: 3,
  signpost: 2,
  backpack: 3,
  snowman: 2,
  balloon: 3,
  umbrella: 3,
};

function drawSun(element: SceneElement, { mood }: DrawContext): Primitive[] {
  if (mood === "night") {
    const fill = shadeColour(MOON_GREY, element.shade);
    return [
      { shape: "circle", cx: 0, cy: -26, r: 36, fill, opacity: 0.22, glow: true },
      { shape: "circle", cx: 0, cy: -26, r: 24, fill, glow: true },
      { shape: "circle", cx: -8, cy: -32, r: 5, fill: CRATER_GREY, glow: true },
      { shape: "circle", cx: 8, cy: -18, r: 4, fill: CRATER_GREY, glow: true },
      { shape: "circle", cx: 6, cy: -35, r: 3, fill: CRATER_GREY, glow: true },
    ];
  }
  if (mood === "overcast") {
    const pale = shadeColour(OVERCAST_SUN, element.shade);
    return [
      { shape: "circle", cx: 0, cy: -26, r: 36, fill: pale, opacity: 0.25 },
      { shape: "circle", cx: 0, cy: -26, r: 24, fill: pale, opacity: 0.8 },
    ];
  }
  const fill = shadeColour(mood === "sunset" ? "#f2a33c" : SUN_YELLOW, element.shade);
  return [
    { shape: "circle", cx: 0, cy: -26, r: 38, fill, opacity: 0.3, glow: true },
    { shape: "circle", cx: 0, cy: -26, r: 26, fill, glow: true },
  ];
}

function drawCloud(element: SceneElement): Primitive[] {
  const fill = shadeColour(CLOUD_WHITE, element.shade);
  const puffs: Primitive[] = [
    { shape: "ellipse", cx: 0, cy: -8, rx: 40, ry: 14, fill },
    { shape: "circle", cx: -18, cy: -20, r: 16, fill },
    { shape: "circle", cx: 6, cy: -26, r: 20, fill },
    { shape: "circle", cx: 26, cy: -16, r: 13, fill },
  ];
  const extra: Primitive[] =
    element.variant % 2 === 1 ? [{ shape: "circle", cx: -34, cy: -12, r: 10, fill }] : [];
  return [...puffs, ...extra];
}

function drawBird(element: SceneElement, { mood }: DrawContext): Primitive[] {
  const night = mood === "night";
  return [
    {
      shape: "polygon",
      points: BIRD_WINGS[element.variant % BIRD_WINGS.length],
      fill: shadeColour(night ? NIGHT_BIRD : BIRD_DARK, element.shade),
      ...(night ? { glow: true } : {}),
    },
  ];
}

function drawMountain(element: SceneElement, { palette }: DrawContext): Primitive[] {
  const fill = shadeColour(palette.mountain, element.shade);
  const parts: Primitive[] = [
    {
      shape: "polygon",
      points: [
        [-120, 0],
        [0, -170],
        [120, 0],
      ],
      fill,
    },
    {
      shape: "polygon",
      points: [
        [0, -170],
        [120, 0],
        [20, 0],
      ],
      fill: shadeColour(palette.mountain, element.shade - 2),
    },
  ];
  const snow: Primitive[] =
    element.variant % 2 === 0
      ? [
          {
            shape: "polygon",
            points: [
              [-34, -120],
              [0, -170],
              [34, -120],
              [18, -112],
              [0, -124],
              [-16, -110],
            ],
            fill: palette.mountainCap,
          },
        ]
      : [];
  return [...parts, ...snow];
}

function drawHill(element: SceneElement, { palette }: DrawContext): Primitive[] {
  return [
    {
      shape: "ellipse",
      cx: 0,
      cy: 0,
      rx: 260,
      ry: 70,
      fill: shadeColour(palette.hill, element.shade),
    },
  ];
}

function drawLake(element: SceneElement, { palette }: DrawContext): Primitive[] {
  return [
    {
      shape: "ellipse",
      cx: 0,
      cy: 0,
      rx: 160,
      ry: 34,
      fill: shadeColour(palette.water, element.shade),
    },
    { shape: "ellipse", cx: -40, cy: -6, rx: 40, ry: 4, fill: palette.ripple },
    { shape: "ellipse", cx: 50, cy: 6, rx: 34, ry: 3, fill: palette.ripple },
  ];
}

function drawPine(element: SceneElement, { palette }: DrawContext): Primitive[] {
  const tiers = 3 + (element.variant % 3);
  const fill = shadeColour(palette.pine, element.shade);
  const trunk: Primitive = {
    shape: "rect",
    x: -4,
    y: -14,
    width: 8,
    height: 14,
    fill: palette.trunk,
  };
  const layers = Array.from({ length: tiers }, (_, index): Primitive => {
    const baseY = -12 - index * 20;
    const halfWidth = 28 - index * 5;
    return {
      shape: "polygon",
      points: [
        [-halfWidth, baseY],
        [halfWidth, baseY],
        [0, baseY - 30],
      ],
      fill,
    };
  });
  return [trunk, ...layers];
}

function drawRoundTree(element: SceneElement, { palette }: DrawContext): Primitive[] {
  const canopies = 1 + (element.variant % 3);
  const fill = shadeColour(palette.trees[element.variant % palette.trees.length], element.shade);
  const blobs: Primitive[] = [
    { shape: "circle", cx: 0, cy: -52, r: 26, fill },
    { shape: "circle", cx: -16, cy: -40, r: 18, fill },
    { shape: "circle", cx: 16, cy: -42, r: 18, fill },
  ];
  return [
    { shape: "rect", x: -5, y: -30, width: 10, height: 30, fill: palette.trunk },
    ...blobs.slice(0, canopies),
  ];
}

function drawBush(element: SceneElement, { palette }: DrawContext): Primitive[] {
  const fill = shadeColour(palette.bush, element.shade);
  const leaves: Primitive[] = [
    { shape: "circle", cx: -14, cy: -10, r: 12, fill },
    { shape: "circle", cx: 0, cy: -16, r: 15, fill },
    { shape: "circle", cx: 15, cy: -10, r: 12, fill },
  ];
  const berry: Primitive[] =
    element.variant % 2 === 1 ? [{ shape: "circle", cx: 6, cy: -18, r: 3, fill: "#d9534f" }] : [];
  return [...leaves, ...berry];
}

function drawTent(element: SceneElement, { palette }: DrawContext): Primitive[] {
  const colour = shadeColour(TENT_COLOURS[element.variant % TENT_COLOURS.length], element.shade);
  const parts: Primitive[] = [
    {
      shape: "polygon",
      points: [
        [-34, 0],
        [34, 0],
        [0, -52],
      ],
      fill: colour,
    },
    {
      shape: "polygon",
      points: [
        [-9, 0],
        [9, 0],
        [0, -24],
      ],
      fill: shadeColour(colour, -3),
    },
  ];
  const flap: Primitive[] =
    element.variant >= TENT_COLOURS.length
      ? [
          {
            shape: "polygon",
            points: [
              [0, -52],
              [34, 0],
              [16, 0],
            ],
            fill: shadeColour(colour, 2),
          },
          { shape: "rect", x: -1.5, y: -62, width: 3, height: 12, fill: palette.trunk },
        ]
      : [];
  return [...parts, ...flap];
}

function drawCampfire(element: SceneElement): Primitive[] {
  const flameHeight = element.variant % 2 === 0 ? 34 : 26;
  return [
    {
      shape: "polygon",
      points: [
        [-22, -2],
        [-20, -8],
        [20, -1],
        [18, 5],
      ],
      fill: LOG_BROWN,
    },
    {
      shape: "polygon",
      points: [
        [22, -2],
        [20, -8],
        [-20, -1],
        [-18, 5],
      ],
      fill: LOG_BROWN,
    },
    {
      shape: "polygon",
      points: [
        [-9, -6],
        [0, -flameHeight],
        [9, -6],
      ],
      fill: shadeColour(FLAME_ORANGE, element.shade),
      glow: true,
    },
    {
      shape: "polygon",
      points: [
        [-4, -6],
        [0, -flameHeight + 14],
        [4, -6],
      ],
      fill: FLAME_YELLOW,
      glow: true,
    },
  ];
}

function drawRock(element: SceneElement, { palette }: DrawContext): Primitive[] {
  return [
    {
      shape: "polygon",
      points: ROCK_OUTLINES[element.variant % ROCK_OUTLINES.length],
      fill: shadeColour(palette.rock, element.shade),
    },
  ];
}

function drawFlower(element: SceneElement, { palette }: DrawContext): Primitive[] {
  const petalCount = 4 + (element.variant % 4);
  const petalColour = palette.flowers[Math.floor(element.variant / 4) % palette.flowers.length];
  const petals = Array.from({ length: petalCount }, (_, index): Primitive => {
    const angle = (index * 2 * Math.PI) / petalCount;
    return {
      shape: "circle",
      cx: Math.round(Math.cos(angle) * 6 * 100) / 100,
      cy: Math.round((-22 + Math.sin(angle) * 6) * 100) / 100,
      r: 4,
      fill: shadeColour(petalColour, element.shade),
    };
  });
  return [
    { shape: "rect", x: -1, y: -18, width: 2, height: 18, fill: palette.stem },
    ...petals,
    { shape: "circle", cx: 0, cy: -22, r: 3.5, fill: "#f5c542" },
  ];
}

function drawCactus(element: SceneElement): Primitive[] {
  const fill = shadeColour(CACTUS_GREEN, element.shade);
  const trunk: Primitive[] = [
    { shape: "rect", x: -8, y: -52, width: 16, height: 52, fill },
    { shape: "circle", cx: 0, cy: -52, r: 7, fill },
  ];
  const leftArm: Primitive[] = [
    { shape: "rect", x: -22, y: -30, width: 15, height: 7, fill },
    { shape: "rect", x: -22, y: -42, width: 7, height: 19, fill },
    { shape: "circle", cx: -18.5, cy: -42, r: 3.5, fill },
  ];
  const rightArm: Primitive[] = [
    { shape: "rect", x: 7, y: -22, width: 15, height: 7, fill },
    { shape: "rect", x: 15, y: -36, width: 7, height: 21, fill },
    { shape: "circle", cx: 18.5, cy: -36, r: 3.5, fill },
  ];
  const arms = [leftArm, rightArm, [...leftArm, ...rightArm]];
  return [...trunk, ...arms[element.variant % arms.length]];
}

function drawPalm(element: SceneElement, { palette }: DrawContext): Primitive[] {
  const leaf = shadeColour(PALM_LEAF, element.shade);
  const lean = element.variant % 2 === 0 ? 8 : -8;
  const top: [number, number] = [lean, -78];
  const fronds: Primitive[] = [
    { shape: "polygon", points: [top, [lean - 52, -58], [lean - 36, -74]], fill: leaf },
    { shape: "polygon", points: [top, [lean + 52, -58], [lean + 36, -74]], fill: leaf },
    { shape: "polygon", points: [top, [lean - 30, -104], [lean - 10, -88]], fill: leaf },
    { shape: "polygon", points: [top, [lean + 30, -104], [lean + 10, -88]], fill: leaf },
    { shape: "polygon", points: [top, [lean - 8, -108], [lean + 8, -108]], fill: leaf },
  ];
  return [
    {
      shape: "polygon",
      points: [
        [-6, 0],
        [6, 0],
        [lean + 4, -78],
        [lean - 4, -78],
      ],
      fill: palette.trunk,
    },
    ...fronds,
    { shape: "circle", cx: lean - 4, cy: -74, r: 4, fill: COCONUT_BROWN },
    { shape: "circle", cx: lean + 4, cy: -74, r: 4, fill: COCONUT_BROWN },
  ];
}

const DRAWERS: Readonly<Record<ElementKind, Drawer>> = {
  sun: drawSun,
  cloud: drawCloud,
  bird: drawBird,
  mountain: drawMountain,
  hill: drawHill,
  lake: drawLake,
  pine: drawPine,
  roundTree: drawRoundTree,
  bush: drawBush,
  tent: drawTent,
  campfire: drawCampfire,
  rock: drawRock,
  flower: drawFlower,
  cactus: drawCactus,
  palm: drawPalm,
  ...EXTRA_DRAWERS,
} as Readonly<Record<ElementKind, Drawer>>;

export function drawElement(
  element: SceneElement,
  context: DrawContext = DEFAULT_CONTEXT,
): Primitive[] {
  return DRAWERS[element.kind](element, context);
}
