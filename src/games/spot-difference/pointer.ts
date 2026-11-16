import type { Point } from "./game";

export interface Frame {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface SceneSize {
  width: number;
  height: number;
}

export function toScenePoint(
  clientX: number,
  clientY: number,
  frame: Frame,
  scene: SceneSize,
): Point {
  return {
    x: ((clientX - frame.left) / frame.width) * scene.width,
    y: ((clientY - frame.top) / frame.height) * scene.height,
  };
}

const MIN_TAP_RADIUS_PX = 12;

export function calculateTapTolerance(
  baseTolerance: number,
  frameWidth: number,
  sceneWidth: number,
): number {
  return Math.max(baseTolerance, (MIN_TAP_RADIUS_PX * sceneWidth) / frameWidth);
}
