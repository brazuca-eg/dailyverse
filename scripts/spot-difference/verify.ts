import { renderSceneSvg } from "../../src/games/spot-difference/render";
import type { Puzzle } from "../../src/games/spot-difference/types";
import { rasteriseSvg } from "../raster";
import { countChangedPixels, findChangedPixels } from "./regions";

export const MIN_CHANGED_PIXELS = 25;

export function verifyPuzzle(puzzle: Puzzle): string[] {
  const first = rasteriseSvg(renderSceneSvg(puzzle.original), puzzle.original.width);
  const second = rasteriseSvg(renderSceneSvg(puzzle.altered), puzzle.altered.width);
  const counts = countChangedPixels(
    findChangedPixels(first, second),
    first.width,
    puzzle.differences.map((difference) => difference.region),
  );
  const tooSmall = puzzle.differences.flatMap((difference, index) =>
    counts.inside[index] < MIN_CHANGED_PIXELS
      ? [`${difference.id} (${difference.kind}) changes only ${counts.inside[index]} pixels`]
      : [],
  );
  const stray =
    counts.outside > 0 ? [`${counts.outside} changed pixels lie outside every difference`] : [];
  return [...tooSmall, ...stray];
}
