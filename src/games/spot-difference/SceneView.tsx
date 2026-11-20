import {
  useMemo,
  useRef,
  type KeyboardEvent,
  type MouseEvent,
  type Ref,
  type UIEvent,
} from "react";
import { findCrosshairMove, findStartPoint, isActivationKey, moveCrosshair } from "./crosshair";
import { TAP_TOLERANCE, type MissMark, type Point } from "./game";
import { spotMessages as t } from "./messages";
import { MARKER_COLOURS } from "./markerColours";
import { calculateTapTolerance, toScenePoint } from "./pointer";
import { renderSceneContent } from "./render";
import type { Bounds, Difference, Scene } from "./types";
import "./SceneView.css";

interface SceneViewProps {
  scene: Scene;
  label: string;
  differences: readonly Difference[];
  foundIds: readonly string[];
  revealAll: boolean;
  miss: MissMark | null;
  crosshair: Point | null;
  zoomed: boolean;
  onTap: (point: Point, tolerance: number) => void;
  onCrosshairChange: (point: Point | null) => void;
  onFrameScroll: (frame: HTMLDivElement) => void;
  frameRef?: Ref<HTMLDivElement>;
}

const MARKER_MIN_RADIUS = 16;
const MARKER_PADDING = 4;
const MISS_ARM = 10;
const CROSSHAIR_ARM = 14;

function describeMarker(region: Bounds): { cx: number; cy: number; rx: number; ry: number } {
  const rx = Math.max((region.right - region.left) / 2, MARKER_MIN_RADIUS) + MARKER_PADDING;
  const ry = Math.max((region.bottom - region.top) / 2, MARKER_MIN_RADIUS) + MARKER_PADDING;
  return { cx: (region.left + region.right) / 2, cy: (region.top + region.bottom) / 2, rx, ry };
}

export function SceneView({
  scene,
  label,
  differences,
  foundIds,
  revealAll,
  miss,
  crosshair,
  zoomed,
  onTap,
  onCrosshairChange,
  onFrameScroll,
  frameRef,
}: SceneViewProps) {
  const content = useMemo(() => renderSceneContent(scene), [scene]);
  const svgRef = useRef<SVGSVGElement>(null);
  const markers = differences.filter((difference) => revealAll || foundIds.includes(difference.id));

  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    const svg = svgRef.current;
    if (!svg || event.detail === 0) {
      return;
    }
    const frame = svg.getBoundingClientRect();
    onCrosshairChange(null);
    onTap(
      toScenePoint(event.clientX, event.clientY, frame, scene),
      calculateTapTolerance(TAP_TOLERANCE, frame.width, scene.width),
    );
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    const origin = crosshair ?? findStartPoint(scene);
    if (isActivationKey(event.key)) {
      event.preventDefault();
      if (crosshair === null) {
        onCrosshairChange(origin);
      } else {
        onTap(origin, TAP_TOLERANCE);
      }
      return;
    }
    const move = findCrosshairMove(event.key, event.shiftKey);
    if (move) {
      event.preventDefault();
      onCrosshairChange(moveCrosshair(origin, move, scene));
    }
  }

  return (
    <div
      ref={frameRef}
      className={zoomed ? "scene-frame scene-frame-zoomed" : "scene-frame"}
      onScroll={(event: UIEvent<HTMLDivElement>) => onFrameScroll(event.currentTarget)}
    >
      <button
        type="button"
        className="scene-button"
        aria-label={`${label}. ${t("spot.scene.keyboard")}`}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
      >
        <svg
          ref={svgRef}
          className="scene"
          viewBox={`0 0 ${scene.width} ${scene.height}`}
          aria-hidden="true"
        >
          <g dangerouslySetInnerHTML={{ __html: content }} />
          {markers.map((difference) => {
            const marker = describeMarker(difference.region);
            const isFound = foundIds.includes(difference.id);
            const draw = isFound ? " marker-draw" : "";
            return (
              <g key={difference.id}>
                <ellipse
                  className={`marker-halo${draw}`}
                  stroke={MARKER_COLOURS.halo}
                  {...marker}
                />
                <ellipse
                  className={`marker ${isFound ? "marker-found" : "marker-missed"}${draw}`}
                  stroke={isFound ? MARKER_COLOURS.found : MARKER_COLOURS.missed}
                  {...marker}
                />
              </g>
            );
          })}
          {miss && (
            <g
              key={miss.key}
              className="miss-mark"
              transform={`translate(${miss.point.x} ${miss.point.y})`}
            >
              <g className="miss-halo" stroke={MARKER_COLOURS.halo}>
                <line x1={-MISS_ARM} y1={-MISS_ARM} x2={MISS_ARM} y2={MISS_ARM} />
                <line x1={-MISS_ARM} y1={MISS_ARM} x2={MISS_ARM} y2={-MISS_ARM} />
              </g>
              <g className="miss-cross" stroke={MARKER_COLOURS.missed}>
                <line x1={-MISS_ARM} y1={-MISS_ARM} x2={MISS_ARM} y2={MISS_ARM} />
                <line x1={-MISS_ARM} y1={MISS_ARM} x2={MISS_ARM} y2={-MISS_ARM} />
              </g>
            </g>
          )}
          {crosshair && (
            <g className="crosshair" transform={`translate(${crosshair.x} ${crosshair.y})`}>
              <circle r={TAP_TOLERANCE} />
              <line x1={-CROSSHAIR_ARM} y1={0} x2={CROSSHAIR_ARM} y2={0} />
              <line x1={0} y1={-CROSSHAIR_ARM} x2={0} y2={CROSSHAIR_ARM} />
            </g>
          )}
        </svg>
      </button>
    </div>
  );
}
