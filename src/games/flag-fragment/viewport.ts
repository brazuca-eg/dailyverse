import type { RevealStage } from "./game";
import type { FlagFocus } from "./types";

export interface FlagViewport {
  zoom: number;
  leftPercent: number;
  topPercent: number;
  blurPx: number;
  greyscale: boolean;
}

const STAGE_ZOOM: Record<RevealStage, number> = {
  "crop-small": 4,
  "crop-large": 2,
  blurred: 1,
  greyscale: 1,
  full: 1,
};

const BLUR_PX = 14;

function centreOffsetPercent(focus: number, zoom: number): number {
  const centred = (0.5 - focus * zoom) * 100;
  return Math.min(0, Math.max((1 - zoom) * 100, centred));
}

export function resolveFlagViewport(stage: RevealStage, focus: FlagFocus): FlagViewport {
  const zoom = STAGE_ZOOM[stage];
  return {
    zoom,
    leftPercent: centreOffsetPercent(focus.x, zoom),
    topPercent: centreOffsetPercent(focus.y, zoom),
    blurPx: stage === "blurred" ? BLUR_PX : 0,
    greyscale: stage === "greyscale",
  };
}
