import { describe, expect, it } from "vitest";
import { calculateTapTolerance, toScenePoint } from "./pointer";

const scene = { width: 800, height: 600 };

describe("toScenePoint", () => {
  it("maps the corners of the picture to the corners of the scene", () => {
    const frame = { left: 100, top: 50, width: 400, height: 300 };
    expect(toScenePoint(100, 50, frame, scene)).toEqual({ x: 0, y: 0 });
    expect(toScenePoint(500, 350, frame, scene)).toEqual({ x: 800, y: 600 });
  });

  it("scales a point to the scene's size", () => {
    const frame = { left: 0, top: 0, width: 400, height: 300 };
    expect(toScenePoint(200, 150, frame, scene)).toEqual({ x: 400, y: 300 });
  });

  it("accounts for where the picture sits on the page", () => {
    const frame = { left: 16, top: 295, width: 480, height: 360 };
    const point = toScenePoint(16 + 240, 295 + 180, frame, scene);
    expect(point.x).toBeCloseTo(400);
    expect(point.y).toBeCloseTo(300);
  });

  it("gives points outside the picture, so they count as misses", () => {
    const frame = { left: 0, top: 0, width: 400, height: 300 };
    expect(toScenePoint(-10, 400, frame, scene).x).toBeLessThan(0);
    expect(toScenePoint(-10, 400, frame, scene).y).toBeGreaterThan(600);
  });

  it("works for a picture shown at its natural size", () => {
    const frame = { left: 0, top: 0, width: 800, height: 600 };
    expect(toScenePoint(123, 456, frame, scene)).toEqual({ x: 123, y: 456 });
  });
});

describe("calculateTapTolerance", () => {
  it("keeps the base tolerance when the picture is large enough", () => {
    expect(calculateTapTolerance(14, 800, 800)).toBe(14);
    expect(calculateTapTolerance(14, 1000, 800)).toBe(14);
  });

  it("grows as the picture is shown smaller so it always covers a fingertip", () => {
    expect(calculateTapTolerance(14, 343, 800)).toBeCloseTo(27.99, 1);
    expect(calculateTapTolerance(14, 400, 800)).toBe(24);
  });

  it("never goes below the base tolerance", () => {
    expect(calculateTapTolerance(14, 5000, 800)).toBe(14);
  });
});
