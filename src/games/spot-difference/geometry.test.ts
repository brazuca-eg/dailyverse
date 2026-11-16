import { describe, expect, it } from "vitest";
import { drawElement } from "./elements";
import { boundsOverlap, isInside, measureElement, measureParts } from "./geometry";
import type { SceneElement } from "./types";

const rock: SceneElement = {
  id: "rock-1",
  kind: "rock",
  x: 100,
  y: 200,
  scale: 1,
  rotation: 0,
  shade: 0,
  variant: 0,
  layer: 5,
};

describe("measureElement", () => {
  it("places the drawing around its anchor point", () => {
    expect(measureElement(rock)).toEqual({ left: 78, top: 180, right: 124, bottom: 200 });
  });

  it("grows with the scale around the anchor", () => {
    const bounds = measureElement({ ...rock, scale: 2 });
    expect(bounds.right - bounds.left).toBe(92);
    expect(bounds.bottom).toBe(200);
    expect(bounds.top).toBe(160);
  });

  it("moves with the element", () => {
    const moved = measureElement({ ...rock, x: 150, y: 260 });
    expect(moved.left).toBe(128);
    expect(moved.bottom).toBe(260);
  });

  it("covers the whole drawing when rotated", () => {
    const turned = measureElement({ ...rock, rotation: 90 });
    const plain = measureElement(rock);
    expect(turned.right - turned.left).toBeCloseTo(plain.bottom - plain.top);
    expect(turned.bottom - turned.top).toBeCloseTo(plain.right - plain.left);
  });

  it("covers every part of a multi-part drawing", () => {
    const pine = measureElement({ ...rock, kind: "pine", variant: 0 });
    expect(pine.bottom).toBe(200);
    expect(pine.top).toBe(200 - 12 - 2 * 20 - 30);
  });
});

describe("boundsOverlap", () => {
  const box = { left: 0, top: 0, right: 10, bottom: 10 };

  it("detects overlapping boxes", () => {
    expect(boundsOverlap(box, { left: 5, top: 5, right: 15, bottom: 15 })).toBe(true);
  });

  it("does not count boxes that only touch", () => {
    expect(boundsOverlap(box, { left: 10, top: 0, right: 20, bottom: 10 })).toBe(false);
  });

  it("counts boxes closer than the padding", () => {
    const near = { left: 12, top: 0, right: 20, bottom: 10 };
    expect(boundsOverlap(box, near)).toBe(false);
    expect(boundsOverlap(box, near, 3)).toBe(true);
  });

  it("does not overlap boxes that are far apart on one axis", () => {
    expect(boundsOverlap(box, { left: 0, top: 50, right: 10, bottom: 60 })).toBe(false);
  });
});

describe("isInside", () => {
  it("accepts a box inside the canvas and rejects one that sticks out", () => {
    expect(isInside({ left: 10, top: 10, right: 90, bottom: 90 }, 100, 100)).toBe(true);
    expect(isInside({ left: -1, top: 10, right: 90, bottom: 90 }, 100, 100)).toBe(false);
    expect(isInside({ left: 10, top: 10, right: 101, bottom: 90 }, 100, 100)).toBe(false);
  });

  it("keeps a margin from the edges", () => {
    const box = { left: 5, top: 5, right: 95, bottom: 95 };
    expect(isInside(box, 100, 100, 5)).toBe(true);
    expect(isInside(box, 100, 100, 6)).toBe(false);
  });
});

describe("measureParts", () => {
  it("measures only the parts it is given", () => {
    const part = { shape: "rect" as const, x: -5, y: -10, width: 10, height: 10, fill: "#000000" };
    expect(measureParts(rock, [part])).toEqual({ left: 95, top: 190, right: 105, bottom: 200 });
  });

  it("matches the whole element when given all of its parts", () => {
    const pine = { ...rock, kind: "pine" as const };
    expect(measureParts(pine, drawElement(pine))).toEqual(measureElement(pine));
  });
});
