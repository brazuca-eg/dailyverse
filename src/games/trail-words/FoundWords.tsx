import type { TrailPuzzle } from "./puzzle";
import "./FoundWords.css";

interface FoundWordsProps {
  puzzle: TrailPuzzle;
  found: readonly string[];
}

const PREVIEW_COUNT = 5;

export function FoundWords({ puzzle, found }: FoundWordsProps) {
  const sorted = [...found].sort();
  const recent = found.slice(-PREVIEW_COUNT).reverse();
  return (
    <section className="found" aria-label="Found words">
      <details>
        <summary className="found-summary">
          <span className="found-count">
            {found.length} {found.length === 1 ? "word" : "words"} found
          </span>
          <span className="found-preview" aria-hidden="true">
            {recent.join(" · ")}
          </span>
        </summary>
        {sorted.length > 0 && (
          <ul className="found-list">
            {sorted.map((word) => (
              <li
                key={word}
                className={
                  puzzle.pangrams.includes(word) ? "found-word found-pangram" : "found-word"
                }
              >
                {word}
              </li>
            ))}
          </ul>
        )}
      </details>
    </section>
  );
}
