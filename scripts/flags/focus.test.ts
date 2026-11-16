import { describe, expect, it } from "vitest";
import type { RasterImage } from "../raster";
import { chooseFocus, countMainColours } from "./focus";

const WIDTH = 120;
const HEIGHT = 90;

type Colour = [number, number, number, number];

const WHITE: Colour = [255, 255, 255, 255];
const RED: Colour = [255, 0, 0, 255];
const BLUE: Colour = [0, 0, 255, 255];
const CLEAR: Colour = [0, 0, 0, 0];

function paint(pickColour: (x: number, y: number) => Colour): RasterImage {
  const pixels = new Uint8Array(WIDTH * HEIGHT * 4);
  for (let y = 0; y < HEIGHT; y++) {
    for (let x = 0; x < WIDTH; x++) {
      pixels.set(pickColour(x, y), (y * WIDTH + x) * 4);
    }
  }
  return { width: WIDTH, height: HEIGHT, pixels };
}

describe("countMainColours", () => {
  it("counts one colour in a flat area", () => {
    const image = paint(() => WHITE);
    expect(countMainColours(image, { x: 0.5, y: 0.5 })).toBe(1);
  });

  it("counts both colours where two stripes meet", () => {
    const image = paint((x) => (x < WIDTH / 2 ? RED : WHITE));
    expect(countMainColours(image, { x: 0.5, y: 0.5 })).toBe(2);
    expect(countMainColours(image, { x: 0.15, y: 0.5 })).toBe(1);
  });

  it("ignores a speck below the colour share threshold", () => {
    const image = paint((x, y) => (x === 60 && y === 45 ? RED : WHITE));
    expect(countMainColours(image, { x: 0.5, y: 0.5 })).toBe(1);
  });

  it("treats transparent pixels as their own colour", () => {
    const image = paint((x) => (x < WIDTH / 2 ? CLEAR : WHITE));
    expect(countMainColours(image, { x: 0.5, y: 0.5 })).toBe(2);
  });
});

describe("chooseFocus", () => {
  it("prefers the centre when every area looks the same", () => {
    expect(chooseFocus(paint(() => BLUE))).toEqual({ x: 0.5, y: 0.5 });
  });

  it("moves to where the colours change instead of a flat stripe", () => {
    const tricolour = paint((x) => (x < WIDTH / 3 ? BLUE : x < (WIDTH * 2) / 3 ? WHITE : RED));
    const focus = chooseFocus(tricolour);
    expect(countMainColours(tricolour, focus)).toBe(2);
    expect(focus.x).not.toBe(0.5);
  });

  it("finds a detail in one corner", () => {
    const image = paint((x, y) => (x < WIDTH * 0.3 && y < HEIGHT * 0.3 ? RED : WHITE));
    const focus = chooseFocus(image);
    expect(countMainColours(image, focus)).toBe(2);
    expect(focus.x).toBeLessThan(0.5);
    expect(focus.y).toBeLessThan(0.5);
  });

  it("keeps the whole crop inside the image", () => {
    const { x, y } = chooseFocus(paint((px, py) => (px > py ? RED : BLUE)));
    [x, y].forEach((value) => {
      expect(value).toBeGreaterThanOrEqual(0.125);
      expect(value).toBeLessThanOrEqual(0.875);
    });
  });
});
