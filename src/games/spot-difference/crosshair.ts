import type { Point } from "./game";
import type { SceneSize } from "./pointer";

export const COARSE_STEP = 24;
export const FINE_STEP = 6;

const DIRECTIONS: Readonly<Record<string, readonly [number, number]>> = {
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
  ArrowUp: [0, -1],
  ArrowDown: [0, 1],
};

export function findCrosshairMove(key: string, fine: boolean): Point | null {
  const direction = DIRECTIONS[key];
  if (!direction) {
    return null;
  }
  const step = fine ? FINE_STEP : COARSE_STEP;
  return { x: direction[0] * step, y: direction[1] * step };
}

export function moveCrosshair(origin: Point, move: Point, scene: SceneSize): Point {
  return {
    x: Math.min(scene.width, Math.max(0, origin.x + move.x)),
    y: Math.min(scene.height, Math.max(0, origin.y + move.y)),
  };
}

export function findStartPoint(scene: SceneSize): Point {
  return { x: scene.width / 2, y: scene.height / 2 };
}

export function isActivationKey(key: string): boolean {
  return key === "Enter" || key === " ";
}
