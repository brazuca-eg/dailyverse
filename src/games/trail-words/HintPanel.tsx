import { buildHints } from "./hints";
import type { TrailPuzzle } from "./puzzle";
import "./HintPanel.css";

interface HintPanelProps {
  puzzle: TrailPuzzle;
  found: readonly string[];
}

export function HintPanel({ puzzle, found }: HintPanelProps) {
  const hints = buildHints(puzzle, new Set(found));
  return (
    <section className="hints" aria-label="Hints">
      <details>
        <summary className="hints-summary">Hint</summary>
        <div className="hints-body">
          {hints.total === 0 ? (
            <p className="hints-note">You have found every common word.</p>
          ) : (
            <>
              <p className="hints-note">
                {hints.total} common {hints.total === 1 ? "word" : "words"} left
                {hints.pangramsLeft > 0 &&
                  `, including ${hints.pangramsLeft} ${hints.pangramsLeft === 1 ? "pangram" : "pangrams"}`}
                .
              </p>
              <table className="hints-table">
                <caption className="visually-hidden">Words left by first letter and length</caption>
                <thead>
                  <tr>
                    <th scope="col">
                      <span className="visually-hidden">First letter</span>
                    </th>
                    {hints.lengths.map((length) => (
                      <th key={length} scope="col">
                        {length}
                      </th>
                    ))}
                    <th scope="col">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {hints.letters.map((letter, row) => (
                    <tr key={letter}>
                      <th scope="row">{letter}</th>
                      {hints.counts[row].map((count, column) => (
                        <td key={hints.lengths[column]}>{count === 0 ? "–" : count}</td>
                      ))}
                      <td>{hints.rowTotals[row]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
      </details>
    </section>
  );
}
