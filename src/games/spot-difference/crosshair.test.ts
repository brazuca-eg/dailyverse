import { describe, expect, it } from "vitest";
import {
  COARSE_STEP,
  FINE_STEP,
  findCrosshairMove,
  findStartPoint,
  isActivationKey,
  moveCrosshair,
} from "./crosshair";

const scene = { width: 800, height: 600 };

describe("findCrosshairMove", () => {
  it("moves a coarse step for each arrow key", () => {
    expect(findCrosshairMove("ArrowLeft", false)).toEqual({ x: -COARSE_STEP, y: 0 });
    expect(findCrosshairMove("ArrowRight", false)).toEqual({ x: COARSE_STEP, y: 0 });
    expect(findCrosshairMove("ArrowUp", false)).toEqual({ x: 0, y: -COARSE_STEP });
    expect(findCrosshairMove("ArrowDown", false)).toEqual({ x: 0, y: COARSE_STEP });
  });

  it("moves a small step when the fine key is held", () => {
    expect(findCrosshairMove("ArrowRight", true)).toEqual({ x: FINE_STEP, y: 0 });
    expect(findCrosshairMove("ArrowUp", true)).toEqual({ x: 0, y: -FINE_STEP });
  });

  it("makes the fine step smaller than the coarse one", () => {
    expect(FINE_STEP).toBeLessThan(COARSE_STEP);
  });

  it("ignores every other key", () => {
    ["a", "Tab", "Enter", " ", "Escape", "Home"].forEach((key) => {
      expect(findCrosshairMove(key, false)).toBeNull();
    });
  });
});

describe("moveCrosshair", () => {
  it("adds the move to the position", () => {
    expect(moveCrosshair({ x: 100, y: 100 }, { x: 24, y: 0 }, scene)).toEqual({ x: 124, y: 100 });
  });

  it("never leaves the picture", () => {
    expect(moveCrosshair({ x: 5, y: 5 }, { x: -24, y: -24 }, scene)).toEqual({ x: 0, y: 0 });
    expect(moveCrosshair({ x: 795, y: 595 }, { x: 24, y: 24 }, scene)).toEqual({ x: 800, y: 600 });
  });

  it("can reach every edge from the start", () => {
    const start = findStartPoint(scene);
    const right = Array.from({ length: 40 }).reduce<{ x: number; y: number }>(
      (point) => moveCrosshair(point, { x: COARSE_STEP, y: 0 }, scene),
      start,
    );
    expect(right.x).toBe(800);
  });
});

describe("findStartPoint", () => {
  it("starts in the middle of the picture", () => {
    expect(findStartPoint(scene)).toEqual({ x: 400, y: 300 });
  });
});

describe("isActivationKey", () => {
  it("accepts Enter and Space only", () => {
    expect(isActivationKey("Enter")).toBe(true);
    expect(isActivationKey(" ")).toBe(true);
    expect(isActivationKey("ArrowDown")).toBe(false);
    expect(isActivationKey("a")).toBe(false);
  });
});
