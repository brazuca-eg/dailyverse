import { LockIcon } from "../../ui/icons";
import type { Clue, ClueKind } from "./types";
import "./CluesList.css";

interface CluesListProps {
  clues: readonly Clue[];
  visibleCount: number;
  highlightIndex: number | null;
}

type Hue = "green" | "blue" | "amber" | "orange" | "purple" | "rose" | "teal";

interface KindStyle {
  emoji: string;
  hue: Hue;
}

const KIND_STYLES: Record<ClueKind, KindStyle> = {
  geography: { emoji: "🌍", hue: "green" },
  outdoor: { emoji: "🥾", hue: "green" },
  climate: { emoji: "⛅", hue: "blue" },
  wildlife: { emoji: "🦒", hue: "amber" },
  food: { emoji: "🍜", hue: "orange" },
  culture: { emoji: "🎭", hue: "purple" },
  film: { emoji: "🎬", hue: "purple" },
  history: { emoji: "📜", hue: "rose" },
  landmark: { emoji: "🏛️", hue: "rose" },
  language: { emoji: "🗣️", hue: "teal" },
  sport: { emoji: "⚽", hue: "teal" },
};

export function CluesList({ clues, visibleCount, highlightIndex }: CluesListProps) {
  return (
    <ol className="clues card-list" aria-label="Clues">
      {clues.map((clue, index) => {
        const number = index + 1;
        if (index >= visibleCount) {
          return (
            <li key={index} className="clue clue-locked" aria-label={`Clue ${number}, locked`}>
              <span className="clue-number">{number}</span>
              <span className="clue-locked-text">
                <LockIcon size={14} /> Locked
              </span>
            </li>
          );
        }
        const style = KIND_STYLES[clue.kind];
        const className = index === highlightIndex ? "clue clue-new" : "clue";
        return (
          <li key={index} className={className}>
            <span className="clue-number">{number}</span>
            <div className="clue-body">
              <span className={`kind-chip hue-${style.hue}`}>
                <span aria-hidden="true">{style.emoji}</span> {clue.kind}
              </span>
              <span className="clue-text">{clue.text}</span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
