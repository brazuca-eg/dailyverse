import { drawElement } from "./elements";
import { THEME_COLOURS, HORIZON_Y } from "./recipes";
import type { Primitive, Scene, SceneElement } from "./types";

function renderPrimitive(primitive: Primitive): string {
  switch (primitive.shape) {
    case "rect":
      return `<rect x="${primitive.x}" y="${primitive.y}" width="${primitive.width}" height="${primitive.height}" fill="${primitive.fill}"/>`;
    case "circle": {
      const opacity = primitive.opacity === undefined ? "" : ` opacity="${primitive.opacity}"`;
      return `<circle cx="${primitive.cx}" cy="${primitive.cy}" r="${primitive.r}" fill="${primitive.fill}"${opacity}/>`;
    }
    case "ellipse":
      return `<ellipse cx="${primitive.cx}" cy="${primitive.cy}" rx="${primitive.rx}" ry="${primitive.ry}" fill="${primitive.fill}"/>`;
    case "polygon":
      return `<polygon points="${primitive.points.map(([x, y]) => `${x},${y}`).join(" ")}" fill="${primitive.fill}"/>`;
  }
}

export function renderElement(element: SceneElement): string {
  const transform = `translate(${element.x} ${element.y}) rotate(${element.rotation}) scale(${element.scale})`;
  const parts = drawElement(element).map(renderPrimitive).join("");
  return `<g data-id="${element.id}" transform="${transform}">${parts}</g>`;
}

export function renderSceneContent(scene: Scene): string {
  const { sky, ground } = THEME_COLOURS[scene.theme];
  const background =
    `<rect x="0" y="0" width="${scene.width}" height="${HORIZON_Y}" fill="${sky}"/>` +
    `<rect x="0" y="${HORIZON_Y}" width="${scene.width}" height="${scene.height - HORIZON_Y}" fill="${ground}"/>`;
  const elements = scene.elements.map(renderElement).join("");
  return `${background}${elements}`;
}

export function renderSceneSvg(scene: Scene): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${scene.width} ${scene.height}" width="${scene.width}" height="${scene.height}">${renderSceneContent(scene)}</svg>`;
}
