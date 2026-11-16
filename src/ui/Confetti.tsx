import type { CSSProperties } from "react";
import "./Confetti.css";

const PIECE_COUNT = 28;
const COLORS = ["#f2b632", "#2f8f5b", "#e8704a", "#4a90d9", "#b06ad4", "#ef6f91"];
const WIDE_PIECE_INTERVAL = 3;

type CssVariables = { [name: `--${string}`]: string };

function createPieceStyle(index: number): CSSProperties & CssVariables {
  const seed = Math.sin(index * 12.9898) * 43758.5453;
  const fraction = seed - Math.floor(seed);
  return {
    left: `${(index / PIECE_COUNT) * 100 + fraction * 3}%`,
    background: COLORS[index % COLORS.length],
    animationDelay: `${(index % 7) * 0.12}s`,
    animationDuration: `${1.9 + fraction * 1.4}s`,
    "--spin": `${Math.round(fraction * 720 - 360)}deg`,
    "--drift": `${Math.round((fraction - 0.5) * 80)}px`,
  };
}

export function Confetti() {
  return (
    <div className="confetti" aria-hidden="true">
      {Array.from({ length: PIECE_COUNT }, (_, index) => (
        <span
          key={index}
          className={
            index % WIDE_PIECE_INTERVAL === 0 ? "confetti-piece confetti-wide" : "confetti-piece"
          }
          style={createPieceStyle(index)}
        />
      ))}
    </div>
  );
}
