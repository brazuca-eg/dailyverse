import { MAX_GUESSES } from "../../core/guessing";
import { findFlagUrl } from "./flagImages";
import { REVEAL_STAGES, type RevealStage } from "./game";
import type { FlagFocus } from "./types";
import { resolveFlagViewport } from "./viewport";
import "./FlagViewer.css";

interface FlagViewerProps {
  code: string;
  focus: FlagFocus;
  stage: RevealStage;
}

export function FlagViewer({ code, focus, stage }: FlagViewerProps) {
  const url = findFlagUrl(code);
  const viewport = resolveFlagViewport(stage, focus);
  const hint = REVEAL_STAGES.indexOf(stage) + 1;
  const filters = [
    viewport.blurPx > 0 ? `blur(${viewport.blurPx}px)` : "",
    viewport.greyscale ? "grayscale(1)" : "",
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <div
      className={`flag-viewer flag-viewer-${stage}`}
      role="img"
      aria-label={`Mystery flag, view ${hint} of ${MAX_GUESSES}`}
    >
      {url && (
        <img
          className="flag-viewer-image"
          src={url}
          alt=""
          draggable={false}
          style={{
            width: `${viewport.zoom * 100}%`,
            height: `${viewport.zoom * 100}%`,
            left: `${viewport.leftPercent}%`,
            top: `${viewport.topPercent}%`,
            filter: filters || "none",
          }}
        />
      )}
    </div>
  );
}
