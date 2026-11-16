import { drawElement } from "./elements";
import type { Bounds, Primitive, SceneElement } from "./types";

function listPrimitiveCorners(primitive: Primitive): [number, number][] {
  switch (primitive.shape) {
    case "rect":
      return [
        [primitive.x, primitive.y],
        [primitive.x + primitive.width, primitive.y + primitive.height],
      ];
    case "circle":
      return [
        [primitive.cx - primitive.r, primitive.cy - primitive.r],
        [primitive.cx + primitive.r, primitive.cy + primitive.r],
      ];
    case "ellipse":
      return [
        [primitive.cx - primitive.rx, primitive.cy - primitive.ry],
        [primitive.cx + primitive.rx, primitive.cy + primitive.ry],
      ];
    case "polygon":
      return primitive.points.map(([x, y]) => [x, y]);
  }
}

function transformPoint(element: SceneElement, [x, y]: [number, number]): [number, number] {
  const radians = (element.rotation * Math.PI) / 180;
  const scaledX = x * element.scale;
  const scaledY = y * element.scale;
  return [
    element.x + scaledX * Math.cos(radians) - scaledY * Math.sin(radians),
    element.y + scaledX * Math.sin(radians) + scaledY * Math.cos(radians),
  ];
}

export function measureParts(element: SceneElement, parts: readonly Primitive[]): Bounds {
  const local = parts.flatMap(listPrimitiveCorners);
  const xs = local.map(([x]) => x);
  const ys = local.map(([, y]) => y);
  const corners: [number, number][] = [
    [Math.min(...xs), Math.min(...ys)],
    [Math.max(...xs), Math.min(...ys)],
    [Math.max(...xs), Math.max(...ys)],
    [Math.min(...xs), Math.max(...ys)],
  ];
  const placed = corners.map((corner) => transformPoint(element, corner));
  return {
    left: Math.min(...placed.map(([x]) => x)),
    top: Math.min(...placed.map(([, y]) => y)),
    right: Math.max(...placed.map(([x]) => x)),
    bottom: Math.max(...placed.map(([, y]) => y)),
  };
}

export function measureElement(element: SceneElement): Bounds {
  return measureParts(element, drawElement(element));
}

export function boundsOverlap(first: Bounds, second: Bounds, padding = 0): boolean {
  return (
    first.left < second.right + padding &&
    first.right + padding > second.left &&
    first.top < second.bottom + padding &&
    first.bottom + padding > second.top
  );
}

export function isInside(bounds: Bounds, width: number, height: number, margin = 0): boolean {
  return (
    bounds.left >= margin &&
    bounds.top >= margin &&
    bounds.right <= width - margin &&
    bounds.bottom <= height - margin
  );
}
