import { shadeColour } from "../../core/colour";
import type { DrawContext } from "./elements";
import type { ElementKind, Primitive, SceneElement } from "./types";

type Point = readonly [number, number];
type Drawer = (element: SceneElement, context: DrawContext) => Primitive[];

const WOOD = "#a0693d";
const DARK_WOOD = "#5b3a22";
const ROOF_RED = "#8f3b2a";
const BARN_RED = "#c0392b";
const WINDOW_LIGHT = "#f6e3a1";
const HAY = "#e3c25a";
const FENCE_WOOD = "#c9a26a";
const DEER_BROWN = "#a8683a";
const RABBIT_COLOURS: readonly string[] = ["#d9c7b0", "#9a9a9a"];
const CAP_COLOURS: readonly string[] = ["#d9473d", "#a8683a", "#e08a2c"];
const BOAT_COLOURS: readonly string[] = ["#d9534f", "#2f6fb3", "#e0a030"];
const BACKPACK_COLOURS: readonly string[] = ["#c0392b", "#2f6fb3", "#e0a030"];
const BALLOON_COLOURS: readonly (readonly [string, string])[] = [
  ["#d9534f", "#f4d35e"],
  ["#2f6fb3", "#f7f1ff"],
  ["#8e5ea2", "#f4a6c0"],
];
const UMBRELLA_COLOURS: readonly (readonly [string, string])[] = [
  ["#d9534f", "#ffffff"],
  ["#2f9aa3", "#f4d35e"],
  ["#e0a030", "#ffffff"],
];

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

function drawCabin(element: SceneElement): Primitive[] {
  const wall = shadeColour(WOOD, element.shade);
  const chimneyX = element.variant === 0 ? 20 : -30;
  return [
    { shape: "rect", x: chimneyX, y: -70, width: 10, height: 26, fill: "#7b5b4a" },
    { shape: "rect", x: -40, y: -34, width: 80, height: 34, fill: wall },
    {
      shape: "polygon",
      points: [
        [-50, -34],
        [50, -34],
        [0, -72],
      ],
      fill: ROOF_RED,
    },
    { shape: "rect", x: -8, y: -22, width: 16, height: 22, fill: DARK_WOOD },
    { shape: "rect", x: 16, y: -26, width: 14, height: 12, fill: WINDOW_LIGHT },
    { shape: "rect", x: -30, y: -26, width: 14, height: 12, fill: WINDOW_LIGHT },
  ];
}

function drawBarn(element: SceneElement): Primitive[] {
  const wall = shadeColour(BARN_RED, element.shade);
  const loft: Primitive[] =
    element.variant === 1 ? [{ shape: "circle", cx: 0, cy: -52, r: 6, fill: "#f4efe6" }] : [];
  return [
    { shape: "rect", x: -44, y: -40, width: 88, height: 40, fill: wall },
    {
      shape: "polygon",
      points: [
        [-50, -40],
        [-30, -66],
        [30, -66],
        [50, -40],
      ],
      fill: shadeColour(wall, -3),
    },
    { shape: "rect", x: -14, y: -28, width: 28, height: 28, fill: "#f4efe6" },
    { shape: "rect", x: -1.5, y: -28, width: 3, height: 28, fill: wall },
    ...loft,
  ];
}

function drawWindmill(element: SceneElement): Primitive[] {
  const turn = element.variant === 0 ? Math.PI / 4 : 0;
  const blades = Array.from({ length: 4 }, (_, index): Primitive => {
    const angle = turn + (index * Math.PI) / 2;
    const [dx, dy] = [Math.cos(angle), Math.sin(angle)];
    const [px, py] = [-dy, dx];
    const hub: Point = [0, -72];
    const tip: Point = [round(hub[0] + dx * 46), round(hub[1] + dy * 46)];
    return {
      shape: "polygon",
      points: [
        [round(hub[0] + px * 3), round(hub[1] + py * 3)],
        [round(tip[0] + px * 6), round(tip[1] + py * 6)],
        [round(tip[0] - px * 6), round(tip[1] - py * 6)],
        [round(hub[0] - px * 3), round(hub[1] - py * 3)],
      ],
      fill: "#f4efe6",
    };
  });
  return [
    {
      shape: "polygon",
      points: [
        [-18, 0],
        [18, 0],
        [10, -70],
        [-10, -70],
      ],
      fill: shadeColour("#e8dfd0", element.shade),
    },
    {
      shape: "polygon",
      points: [
        [-13, -70],
        [13, -70],
        [0, -88],
      ],
      fill: ROOF_RED,
    },
    ...blades,
    { shape: "circle", cx: 0, cy: -72, r: 5, fill: DARK_WOOD },
  ];
}

function drawHaybale(element: SceneElement): Primitive[] {
  const fill = shadeColour(HAY, element.shade);
  const bale = (cy: number): Primitive[] => [
    { shape: "ellipse", cx: 0, cy, rx: 20, ry: 14, fill },
    { shape: "rect", x: -9, y: cy - 13, width: 3, height: 26, fill: shadeColour(HAY, -3) },
    { shape: "rect", x: 6, y: cy - 13, width: 3, height: 26, fill: shadeColour(HAY, -3) },
  ];
  return element.variant === 0 ? bale(-14) : [...bale(-14), ...bale(-40).slice(0, 1)];
}

function drawFence(element: SceneElement): Primitive[] {
  const wood = shadeColour(FENCE_WOOD, element.shade);
  const posts = [-36, -12, 12, 36].map((x): Primitive => ({
    shape: "rect",
    x: x - 2.5,
    y: -26,
    width: 5,
    height: 26,
    fill: wood,
  }));
  const rails: Primitive[] =
    element.variant === 0
      ? [
          { shape: "rect", x: -38, y: -21, width: 76, height: 4, fill: wood },
          { shape: "rect", x: -38, y: -10, width: 76, height: 4, fill: wood },
        ]
      : [{ shape: "rect", x: -38, y: -16, width: 76, height: 5, fill: wood }];
  return [...posts, ...rails];
}

function drawBoat(element: SceneElement): Primitive[] {
  const hull = shadeColour(BOAT_COLOURS[element.variant % BOAT_COLOURS.length], element.shade);
  const sail: Primitive[] =
    element.variant === 2
      ? [
          { shape: "rect", x: -1.5, y: -48, width: 3, height: 48, fill: DARK_WOOD },
          {
            shape: "polygon",
            points: [
              [2, -46],
              [2, -8],
              [28, -8],
            ],
            fill: "#ffffff",
          },
        ]
      : [{ shape: "rect", x: -12, y: -6, width: 24, height: 4, fill: shadeColour(hull, 3) }];
  return [
    ...sail,
    {
      shape: "polygon",
      points: [
        [-32, -2],
        [32, -2],
        [22, 12],
        [-22, 12],
      ],
      fill: hull,
    },
  ];
}

function drawDuck(element: SceneElement): Primitive[] {
  const body = shadeColour("#f7e08a", element.shade);
  const grown = element.variant === 0;
  return [
    { shape: "ellipse", cx: 0, cy: -8, rx: grown ? 13 : 9, ry: grown ? 8 : 6, fill: body },
    {
      shape: "circle",
      cx: grown ? 11 : 8,
      cy: grown ? -17 : -13,
      r: grown ? 6 : 4.5,
      fill: grown ? "#2f7a5a" : body,
    },
    {
      shape: "polygon",
      points: [
        [grown ? 16 : 12, grown ? -18 : -14],
        [grown ? 24 : 18, grown ? -15 : -12],
        [grown ? 16 : 12, grown ? -14 : -11],
      ],
      fill: "#f08a24",
    },
  ];
}

function drawDeer(element: SceneElement): Primitive[] {
  const fur = shadeColour(DEER_BROWN, element.shade);
  const legs = [-14, -8, 8, 14].map((x): Primitive => ({
    shape: "rect",
    x: x - 2,
    y: -18,
    width: 4,
    height: 18,
    fill: shadeColour(DEER_BROWN, -2),
  }));
  const antlers: Primitive[] =
    element.variant === 1
      ? [
          {
            shape: "polygon",
            points: [
              [24, -58],
              [20, -74],
              [23, -74],
              [27, -60],
            ],
            fill: "#d8c7a0",
          },
          {
            shape: "polygon",
            points: [
              [29, -58],
              [34, -74],
              [31, -74],
              [26, -60],
            ],
            fill: "#d8c7a0",
          },
        ]
      : [];
  return [
    ...legs,
    { shape: "ellipse", cx: 0, cy: -26, rx: 22, ry: 12, fill: fur },
    {
      shape: "polygon",
      points: [
        [14, -30],
        [24, -30],
        [28, -54],
        [20, -52],
      ],
      fill: fur,
    },
    { shape: "ellipse", cx: 27, cy: -55, rx: 8, ry: 5, fill: fur },
    { shape: "circle", cx: -22, cy: -28, r: 3.5, fill: "#f4efe6" },
    ...antlers,
  ];
}

function drawRabbit(element: SceneElement): Primitive[] {
  const fur = shadeColour(RABBIT_COLOURS[element.variant % RABBIT_COLOURS.length], element.shade);
  return [
    { shape: "ellipse", cx: 8, cy: -30, rx: 2.5, ry: 9, fill: fur },
    { shape: "ellipse", cx: 14, cy: -30, rx: 2.5, ry: 9, fill: fur },
    { shape: "ellipse", cx: 0, cy: -10, rx: 12, ry: 9, fill: fur },
    { shape: "circle", cx: 11, cy: -18, r: 6.5, fill: fur },
    { shape: "circle", cx: -12, cy: -12, r: 3.5, fill: "#ffffff" },
  ];
}

function drawMushroom(element: SceneElement): Primitive[] {
  const cap = shadeColour(CAP_COLOURS[element.variant % CAP_COLOURS.length], element.shade);
  return [
    { shape: "rect", x: -4, y: -11, width: 8, height: 11, fill: "#f1e6d2" },
    { shape: "ellipse", cx: 0, cy: -12, rx: 13, ry: 9, fill: cap },
    { shape: "circle", cx: -5, cy: -15, r: 2, fill: "#ffffff" },
    { shape: "circle", cx: 4, cy: -12, r: 2.4, fill: "#ffffff" },
  ];
}

function drawSignpost(element: SceneElement): Primitive[] {
  const board = shadeColour("#d9b573", element.shade);
  const second: Primitive[] =
    element.variant === 1
      ? [
          {
            shape: "polygon",
            points: [
              [4, -30],
              [-26, -30],
              [-32, -24],
              [-26, -18],
              [4, -18],
            ],
            fill: shadeColour("#d9b573", element.shade - 2),
          },
        ]
      : [];
  return [
    { shape: "rect", x: -3, y: -46, width: 6, height: 46, fill: DARK_WOOD },
    {
      shape: "polygon",
      points: [
        [-4, -46],
        [26, -46],
        [32, -40],
        [26, -34],
        [-4, -34],
      ],
      fill: board,
    },
    ...second,
  ];
}

function drawBackpack(element: SceneElement): Primitive[] {
  const body = shadeColour(
    BACKPACK_COLOURS[element.variant % BACKPACK_COLOURS.length],
    element.shade,
  );
  return [
    { shape: "rect", x: -12, y: -26, width: 24, height: 26, fill: body },
    { shape: "rect", x: -12, y: -31, width: 24, height: 8, fill: shadeColour(body, -3) },
    { shape: "rect", x: -3, y: -13, width: 12, height: 10, fill: shadeColour(body, -2) },
    { shape: "rect", x: -15, y: -22, width: 4, height: 14, fill: shadeColour(body, -3) },
  ];
}

function drawSnowman(element: SceneElement): Primitive[] {
  const snow = shadeColour("#ffffff", element.shade);
  const scarf: Primitive[] =
    element.variant === 1
      ? [{ shape: "rect", x: -9, y: -52, width: 18, height: 5, fill: "#d9534f" }]
      : [];
  return [
    { shape: "circle", cx: 0, cy: -16, r: 16, fill: snow },
    { shape: "circle", cx: 0, cy: -40, r: 12, fill: snow },
    { shape: "circle", cx: 0, cy: -60, r: 9, fill: snow },
    ...scarf,
    {
      shape: "polygon",
      points: [
        [0, -61],
        [10, -59],
        [0, -57],
      ],
      fill: "#f08a24",
    },
    { shape: "circle", cx: -3, cy: -63, r: 1.3, fill: "#333333" },
    { shape: "circle", cx: 3, cy: -63, r: 1.3, fill: "#333333" },
    { shape: "rect", x: -8, y: -76, width: 16, height: 8, fill: "#333333" },
  ];
}

function drawBalloon(element: SceneElement): Primitive[] {
  const [main, stripe] = BALLOON_COLOURS[element.variant % BALLOON_COLOURS.length];
  const envelope = shadeColour(main, element.shade);
  return [
    { shape: "circle", cx: 0, cy: 0, r: 28, fill: envelope },
    {
      shape: "polygon",
      points: [
        [-24, 12],
        [24, 12],
        [8, 40],
        [-8, 40],
      ],
      fill: envelope,
    },
    { shape: "ellipse", cx: 0, cy: 0, rx: 10, ry: 28, fill: stripe },
    { shape: "rect", x: -8, y: 44, width: 16, height: 10, fill: DARK_WOOD },
  ];
}

function drawUmbrella(element: SceneElement): Primitive[] {
  const [main, stripe] = UMBRELLA_COLOURS[element.variant % UMBRELLA_COLOURS.length];
  const canopy = shadeColour(main, element.shade);
  return [
    { shape: "rect", x: -1.5, y: -52, width: 3, height: 52, fill: "#8a6a4a" },
    {
      shape: "polygon",
      points: [
        [-34, -42],
        [-24, -56],
        [0, -64],
        [24, -56],
        [34, -42],
      ],
      fill: canopy,
    },
    {
      shape: "polygon",
      points: [
        [-10, -42],
        [-6, -62],
        [6, -62],
        [10, -42],
      ],
      fill: stripe,
    },
  ];
}

export const EXTRA_DRAWERS: Readonly<Partial<Record<ElementKind, Drawer>>> = {
  cabin: drawCabin,
  barn: drawBarn,
  windmill: drawWindmill,
  haybale: drawHaybale,
  fence: drawFence,
  boat: drawBoat,
  duck: drawDuck,
  deer: drawDeer,
  rabbit: drawRabbit,
  mushroom: drawMushroom,
  signpost: drawSignpost,
  backpack: drawBackpack,
  snowman: drawSnowman,
  balloon: drawBalloon,
  umbrella: drawUmbrella,
};
