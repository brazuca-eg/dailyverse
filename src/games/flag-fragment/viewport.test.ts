import { describe, expect, it } from "vitest";
import { resolveFlagViewport } from "./viewport";

describe("resolveFlagViewport", () => {
  it("zooms in four times on the focus point for the first view", () => {
    expect(resolveFlagViewport("crop-small", { x: 0.5, y: 0.5 })).toEqual({
      zoom: 4,
      leftPercent: -150,
      topPercent: -150,
      blurPx: 0,
      greyscale: false,
    });
  });

  it("zooms in twice for the second view", () => {
    expect(resolveFlagViewport("crop-large", { x: 0.5, y: 0.5 })).toMatchObject({
      zoom: 2,
      leftPercent: -50,
      topPercent: -50,
    });
  });

  it("shows the whole flag, blurred, for the third view", () => {
    expect(resolveFlagViewport("blurred", { x: 0.2, y: 0.8 })).toEqual({
      zoom: 1,
      leftPercent: 0,
      topPercent: 0,
      blurPx: 14,
      greyscale: false,
    });
  });

  it("shows the whole flag without colour for the fourth view", () => {
    expect(resolveFlagViewport("greyscale", { x: 0.2, y: 0.8 })).toEqual({
      zoom: 1,
      leftPercent: 0,
      topPercent: 0,
      blurPx: 0,
      greyscale: true,
    });
  });

  it("shows the clear, whole flag at the end", () => {
    expect(resolveFlagViewport("full", { x: 0.7, y: 0.5 })).toEqual({
      zoom: 1,
      leftPercent: 0,
      topPercent: 0,
      blurPx: 0,
      greyscale: false,
    });
  });

  it("moves the crop toward the focus point", () => {
    const left = resolveFlagViewport("crop-small", { x: 0.3, y: 0.5 });
    const right = resolveFlagViewport("crop-small", { x: 0.7, y: 0.5 });
    expect(left.leftPercent).toBeGreaterThan(right.leftPercent);
  });

  it("never lets the crop run past the edge of the flag", () => {
    const corners = [0.125, 0.5, 0.875];
    corners.forEach((x) =>
      corners.forEach((y) => {
        (["crop-small", "crop-large"] as const).forEach((stage) => {
          const viewport = resolveFlagViewport(stage, { x, y });
          const lowest = (1 - viewport.zoom) * 100;
          expect(viewport.leftPercent).toBeLessThanOrEqual(0);
          expect(viewport.leftPercent).toBeGreaterThanOrEqual(lowest);
          expect(viewport.topPercent).toBeLessThanOrEqual(0);
          expect(viewport.topPercent).toBeGreaterThanOrEqual(lowest);
        });
      }),
    );
  });
});
