import type { Bounds } from "../../src/games/spot-difference/types";
import type { RasterImage } from "../raster";

export const CHANGE_THRESHOLD = 24;

export function findChangedPixels(first: RasterImage, second: RasterImage): Uint8Array {
  const mask = new Uint8Array(first.width * first.height);
  for (let index = 0; index < mask.length; index += 1) {
    const offset = index * 4;
    const difference = [0, 1, 2, 3].reduce(
      (sum, channel) =>
        sum + Math.abs(first.pixels[offset + channel] - second.pixels[offset + channel]),
      0,
    );
    mask[index] = difference > CHANGE_THRESHOLD ? 1 : 0;
  }
  return mask;
}

function isInside(bounds: Bounds, x: number, y: number): boolean {
  return x >= bounds.left && x < bounds.right && y >= bounds.top && y < bounds.bottom;
}

export function countChangedPixels(
  mask: Uint8Array,
  width: number,
  regions: readonly Bounds[],
): { inside: number[]; outside: number } {
  const inside = regions.map(() => 0);
  let outside = 0;
  for (let index = 0; index < mask.length; index += 1) {
    if (mask[index] === 1) {
      const x = index % width;
      const y = Math.floor(index / width);
      const owner = regions.findIndex((region) => isInside(region, x, y));
      if (owner === -1) {
        outside += 1;
      } else {
        inside[owner] += 1;
      }
    }
  }
  return { inside, outside };
}
