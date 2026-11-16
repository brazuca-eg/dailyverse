import { describe, expect, it } from "vitest";
import type { RasterImage } from "../raster";
import { CHANGE_THRESHOLD, countChangedPixels, findChangedPixels } from "./regions";

const WIDTH = 20;
const HEIGHT = 10;

function paint(pick: (x: number, y: number) => [number, number, number, number]): RasterImage {
  const pixels = new Uint8Array(WIDTH * HEIGHT * 4);
  for (let y = 0; y < HEIGHT; y += 1) {
    for (let x = 0; x < WIDTH; x += 1) {
      pixels.set(pick(x, y), (y * WIDTH + x) * 4);
    }
  }
  return { width: WIDTH, height: HEIGHT, pixels };
}

const WHITE: [number, number, number, number] = [255, 255, 255, 255];
const RED: [number, number, number, number] = [255, 0, 0, 255];

describe("findChangedPixels", () => {
  it("marks nothing for identical images", () => {
    const image = paint(() => WHITE);
    expect(findChangedPixels(image, image).every((value) => value === 0)).toBe(true);
  });

  it("marks exactly the pixels that differ clearly", () => {
    const first = paint(() => WHITE);
    const second = paint((x, y) => (x === 3 && y === 4 ? RED : WHITE));
    const mask = findChangedPixels(first, second);
    expect(mask.reduce((sum, value) => sum + value, 0)).toBe(1);
    expect(mask[4 * WIDTH + 3]).toBe(1);
  });

  it("ignores differences at or below the threshold", () => {
    const first = paint(() => WHITE);
    const barely = paint(() => [255 - CHANGE_THRESHOLD, 255, 255, 255]);
    const clearly = paint(() => [255 - CHANGE_THRESHOLD - 1, 255, 255, 255]);
    expect(findChangedPixels(first, barely).every((value) => value === 0)).toBe(true);
    expect(findChangedPixels(first, clearly).every((value) => value === 1)).toBe(true);
  });

  it("counts a change in transparency as a change", () => {
    const first = paint(() => WHITE);
    const second = paint(() => [255, 255, 255, 0]);
    expect(findChangedPixels(first, second).every((value) => value === 1)).toBe(true);
  });
});

describe("countChangedPixels", () => {
  const mask = new Uint8Array(WIDTH * HEIGHT);
  [2, 3, 12, 13, 14].forEach((x) => {
    mask[5 * WIDTH + x] = 1;
  });

  it("counts changed pixels inside each region", () => {
    const regions = [
      { left: 0, top: 0, right: 5, bottom: 10 },
      { left: 10, top: 0, right: 20, bottom: 10 },
    ];
    expect(countChangedPixels(mask, WIDTH, regions)).toEqual({ inside: [2, 3], outside: 0 });
  });

  it("counts changed pixels that are in no region as outside", () => {
    const regions = [{ left: 0, top: 0, right: 5, bottom: 10 }];
    expect(countChangedPixels(mask, WIDTH, regions)).toEqual({ inside: [2], outside: 3 });
  });

  it("treats a region's right and bottom edges as outside it", () => {
    const regions = [{ left: 0, top: 0, right: 3, bottom: 5 }];
    expect(countChangedPixels(mask, WIDTH, regions).inside).toEqual([0]);
  });

  it("counts a pixel once, in the first region that holds it", () => {
    const regions = [
      { left: 0, top: 0, right: 5, bottom: 10 },
      { left: 0, top: 0, right: 5, bottom: 10 },
    ];
    expect(countChangedPixels(mask, WIDTH, regions).inside).toEqual([2, 0]);
  });
});
