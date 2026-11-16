import { shadeColour } from "../../core/colour";
import type { ElementKind, Primitive, SceneElement } from "./types";

type Point = readonly [number, number];

const TRUNK = "#7a5230";
const PINE_GREEN = "#2f7d57";
const TREE_GREEN = "#4a9a5f";
const BUSH_GREEN = "#3f8f55";
const STEM_GREEN = "#4f9a4a";
const ROCK_GREY = "#8d9199";
const MOUNTAIN_BLUE = "#6f7f99";
const SNOW = "#f4f7fb";
const HILL_GREEN = "#7fb069";
const WATER_BLUE = "#5aa9e6";
const RIPPLE_BLUE = "#8cc8f2";
const CLOUD_WHITE = "#ffffff";
const SUN_YELLOW = "#f7c948";
const BIRD_DARK = "#3a3f4a";
const FLAME_ORANGE = "#f08a24";
const FLAME_YELLOW = "#f9d44a";
const LOG_BROWN = "#6b4423";

export const TENT_COLOURS: readonly string[] = ["#e07a3f", "#d9534f", "#2f9aa3"];
export const FLOWER_COLOURS: readonly string[] = ["#f4a6c0", "#f7f1ff", "#f49a4a"];

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
};

function drawSun(element: SceneElement): Primitive[] {
  const fill = shadeColour(SUN_YELLOW, element.shade);
  return [
    { shape: "circle", cx: 0, cy: -26, r: 38, fill, opacity: 0.3 },
    { shape: "circle", cx: 0, cy: -26, r: 26, fill },
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

function drawBird(element: SceneElement): Primitive[] {
  return [
    {
      shape: "polygon",
      points: BIRD_WINGS[element.variant % BIRD_WINGS.length],
      fill: shadeColour(BIRD_DARK, element.shade),
    },
  ];
}

function drawMountain(element: SceneElement): Primitive[] {
  const fill = shadeColour(MOUNTAIN_BLUE, element.shade);
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
      fill: shadeColour(MOUNTAIN_BLUE, element.shade - 2),
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
            fill: SNOW,
          },
        ]
      : [];
  return [...parts, ...snow];
}

function drawHill(element: SceneElement): Primitive[] {
  return [
    {
      shape: "ellipse",
      cx: 0,
      cy: 0,
      rx: 260,
      ry: 70,
      fill: shadeColour(HILL_GREEN, element.shade),
    },
  ];
}

function drawLake(element: SceneElement): Primitive[] {
  return [
    {
      shape: "ellipse",
      cx: 0,
      cy: 0,
      rx: 160,
      ry: 34,
      fill: shadeColour(WATER_BLUE, element.shade),
    },
    { shape: "ellipse", cx: -40, cy: -6, rx: 40, ry: 4, fill: RIPPLE_BLUE },
    { shape: "ellipse", cx: 50, cy: 6, rx: 34, ry: 3, fill: RIPPLE_BLUE },
  ];
}

function drawPine(element: SceneElement): Primitive[] {
  const tiers = 3 + (element.variant % 3);
  const fill = shadeColour(PINE_GREEN, element.shade);
  const trunk: Primitive = { shape: "rect", x: -4, y: -14, width: 8, height: 14, fill: TRUNK };
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

function drawRoundTree(element: SceneElement): Primitive[] {
  const canopies = 1 + (element.variant % 3);
  const fill = shadeColour(TREE_GREEN, element.shade);
  const blobs: Primitive[] = [
    { shape: "circle", cx: 0, cy: -52, r: 26, fill },
    { shape: "circle", cx: -16, cy: -40, r: 18, fill },
    { shape: "circle", cx: 16, cy: -42, r: 18, fill },
  ];
  return [
    { shape: "rect", x: -5, y: -30, width: 10, height: 30, fill: TRUNK },
    ...blobs.slice(0, canopies),
  ];
}

function drawBush(element: SceneElement): Primitive[] {
  const fill = shadeColour(BUSH_GREEN, element.shade);
  const leaves: Primitive[] = [
    { shape: "circle", cx: -14, cy: -10, r: 12, fill },
    { shape: "circle", cx: 0, cy: -16, r: 15, fill },
    { shape: "circle", cx: 15, cy: -10, r: 12, fill },
  ];
  const berry: Primitive[] =
    element.variant % 2 === 1 ? [{ shape: "circle", cx: 6, cy: -18, r: 3, fill: "#d9534f" }] : [];
  return [...leaves, ...berry];
}

function drawTent(element: SceneElement): Primitive[] {
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
          { shape: "rect", x: -1.5, y: -62, width: 3, height: 12, fill: TRUNK },
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
    },
    {
      shape: "polygon",
      points: [
        [-4, -6],
        [0, -flameHeight + 14],
        [4, -6],
      ],
      fill: FLAME_YELLOW,
    },
  ];
}

function drawRock(element: SceneElement): Primitive[] {
  return [
    {
      shape: "polygon",
      points: ROCK_OUTLINES[element.variant % ROCK_OUTLINES.length],
      fill: shadeColour(ROCK_GREY, element.shade),
    },
  ];
}

function drawFlower(element: SceneElement): Primitive[] {
  const petalCount = 4 + (element.variant % 4);
  const petalColour = FLOWER_COLOURS[Math.floor(element.variant / 4) % FLOWER_COLOURS.length];
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
    { shape: "rect", x: -1, y: -18, width: 2, height: 18, fill: STEM_GREEN },
    ...petals,
    { shape: "circle", cx: 0, cy: -22, r: 3.5, fill: "#f5c542" },
  ];
}

const DRAWERS: Readonly<Record<ElementKind, (element: SceneElement) => Primitive[]>> = {
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
};

export function drawElement(element: SceneElement): Primitive[] {
  return DRAWERS[element.kind](element);
}
