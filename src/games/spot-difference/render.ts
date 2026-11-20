import { createRandom, hashSeed } from "../../core/random";
import { DEFAULT_CONTEXT, drawElement, type DrawContext } from "./elements";
import { PALETTES, listSkyBands, tintColour } from "./palettes";
import { HORIZON_Y, SEA_DEPTH } from "./recipes";
import type { Primitive, Scene, SceneElement, SceneMood } from "./types";

const STAR_COUNT = 34;
const FOAM = "#f6fbff";

function paint(fill: string, mood: SceneMood, isGlowing: boolean | undefined): string {
  return isGlowing ? fill : tintColour(fill, mood);
}

function renderPrimitive(primitive: Primitive, mood: SceneMood): string {
  const fill = paint(primitive.fill, mood, primitive.glow);
  switch (primitive.shape) {
    case "rect":
      return `<rect x="${primitive.x}" y="${primitive.y}" width="${primitive.width}" height="${primitive.height}" fill="${fill}"/>`;
    case "circle": {
      const opacity = primitive.opacity === undefined ? "" : ` opacity="${primitive.opacity}"`;
      return `<circle cx="${primitive.cx}" cy="${primitive.cy}" r="${primitive.r}" fill="${fill}"${opacity}/>`;
    }
    case "ellipse":
      return `<ellipse cx="${primitive.cx}" cy="${primitive.cy}" rx="${primitive.rx}" ry="${primitive.ry}" fill="${fill}"/>`;
    case "polygon":
      return `<polygon points="${primitive.points.map(([x, y]) => `${x},${y}`).join(" ")}" fill="${fill}"/>`;
  }
}

export function renderElement(
  element: SceneElement,
  context: DrawContext = DEFAULT_CONTEXT,
): string {
  const transform = `translate(${element.x} ${element.y}) rotate(${element.rotation}) scale(${element.flip ? -element.scale : element.scale} ${element.scale})`;
  const parts = drawElement(element, context)
    .map((primitive) => renderPrimitive(primitive, context.mood))
    .join("");
  return `<g data-id="${element.id}" transform="${transform}">${parts}</g>`;
}

function renderSky(scene: Scene): string {
  const bands = listSkyBands(scene.theme, scene.mood);
  const height = HORIZON_Y / bands.length;
  return bands
    .map(
      (fill, index) =>
        `<rect x="0" y="${Math.round(index * height)}" width="${scene.width}" height="${Math.ceil(height) + 1}" fill="${fill}"/>`,
    )
    .join("");
}

function renderStars(scene: Scene): string {
  if (scene.mood !== "night") {
    return "";
  }
  const random = createRandom(hashSeed(scene.seed + 7));
  return Array.from({ length: STAR_COUNT }, () => {
    const x = Math.round(random() * (scene.width - 20)) + 10;
    const y = Math.round(random() * (HORIZON_Y - 60)) + 12;
    const radius = random() < 0.2 ? 2.2 : 1.4;
    return `<circle cx="${x}" cy="${y}" r="${radius}" fill="#eef2ff" opacity="0.85"/>`;
  }).join("");
}

function renderSea(scene: Scene): string {
  const { sea } = PALETTES[scene.theme];
  if (sea === null) {
    return "";
  }
  return (
    `<rect x="0" y="${HORIZON_Y}" width="${scene.width}" height="${SEA_DEPTH}" fill="${tintColour(sea, scene.mood)}"/>` +
    `<rect x="0" y="${HORIZON_Y + SEA_DEPTH - 5}" width="${scene.width}" height="5" fill="${tintColour(FOAM, scene.mood)}"/>`
  );
}

export function renderSceneContent(scene: Scene): string {
  const palette = PALETTES[scene.theme];
  const ground = tintColour(palette.ground, scene.mood);
  const background =
    renderSky(scene) +
    renderStars(scene) +
    `<rect x="0" y="${HORIZON_Y}" width="${scene.width}" height="${scene.height - HORIZON_Y}" fill="${ground}"/>` +
    renderSea(scene);
  const context: DrawContext = { palette, mood: scene.mood };
  const elements = scene.elements.map((element) => renderElement(element, context)).join("");
  return `${background}${elements}`;
}

export function renderSceneSvg(scene: Scene): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${scene.width} ${scene.height}" width="${scene.width}" height="${scene.height}">${renderSceneContent(scene)}</svg>`;
}
