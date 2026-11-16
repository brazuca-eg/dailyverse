import type { FlagFocus } from "../../src/games/flag-fragment/types";

export interface RasterImage {
  width: number;
  height: number;
  pixels: Uint8Array;
}

const WINDOW_SHARE = 0.25;
const CANDIDATE_CENTRES = [0.15, 0.3, 0.5, 0.7, 0.85];
const MIN_COLOUR_SHARE = 0.03;
const COLOUR_BITS_DROPPED = 4;

function quantiseColour(image: RasterImage, x: number, y: number): number {
  const offset = (y * image.width + x) * 4;
  const [red, green, blue, alpha] = [0, 1, 2, 3].map((channel) => image.pixels[offset + channel]);
  return alpha < 128
    ? -1
    : ((red >> COLOUR_BITS_DROPPED) << 8) |
        ((green >> COLOUR_BITS_DROPPED) << 4) |
        (blue >> COLOUR_BITS_DROPPED);
}

function listWindowColours(image: RasterImage, focus: FlagFocus): number[] {
  const halfWidth = Math.round((image.width * WINDOW_SHARE) / 2);
  const halfHeight = Math.round((image.height * WINDOW_SHARE) / 2);
  const centreX = Math.round(focus.x * image.width);
  const centreY = Math.round(focus.y * image.height);
  const colours: number[] = [];
  for (
    let y = Math.max(0, centreY - halfHeight);
    y < Math.min(image.height, centreY + halfHeight);
    y++
  ) {
    for (
      let x = Math.max(0, centreX - halfWidth);
      x < Math.min(image.width, centreX + halfWidth);
      x++
    ) {
      colours.push(quantiseColour(image, x, y));
    }
  }
  return colours;
}

export function countMainColours(image: RasterImage, focus: FlagFocus): number {
  const colours = listWindowColours(image, focus);
  const counts = new Map<number, number>();
  colours.forEach((colour) => counts.set(colour, (counts.get(colour) ?? 0) + 1));
  return [...counts.values()].filter((count) => count / colours.length >= MIN_COLOUR_SHARE).length;
}

function measureDistanceFromCentre(focus: FlagFocus): number {
  return Math.hypot(focus.x - 0.5, focus.y - 0.5);
}

export function chooseFocus(image: RasterImage): FlagFocus {
  const candidates = CANDIDATE_CENTRES.flatMap((y) => CANDIDATE_CENTRES.map((x) => ({ x, y })));
  const scored = candidates.map((focus) => ({ focus, colours: countMainColours(image, focus) }));
  const best = Math.max(...scored.map((entry) => entry.colours));
  return scored
    .filter((entry) => entry.colours === best)
    .sort((a, b) => measureDistanceFromCentre(a.focus) - measureDistanceFromCentre(b.focus))[0]
    .focus;
}
