import { buildHints } from "./hints";
import { t } from "./messages";
import type { TrailPuzzle } from "./puzzle";
import "./HintPanel.css";

interface HintPanelProps {
  puzzle: TrailPuzzle;
  found: readonly string[];
}

export function HintPanel({ puzzle, found }: HintPanelProps) {
  const hints = buildHints(puzzle, new Set(found));
  return (
    <section className="hints" aria-label={t("words.hint.label")}>
      <details>
        <summary className="hints-summary">{t("words.hint.summary")}</summary>
        <div className="hints-body">
          {hints.total === 0 ? (
            <p className="hints-note">{t("words.hint.none")}</p>
          ) : (
            <>
              <p className="hints-note">
                {t("words.hint.left", { count: hints.total })}
                {hints.pangramsLeft > 0 &&
                  `, ${t("words.hint.pangrams", { count: hints.pangramsLeft })}`}
                .
              </p>
              <table className="hints-table">
                <caption className="visually-hidden">{t("words.hint.caption")}</caption>
                <thead>
                  <tr>
                    <th scope="col">
                      <span className="visually-hidden">{t("words.hint.firstLetter")}</span>
                    </th>
                    {hints.lengths.map((length) => (
                      <th key={length} scope="col">
                        {length}
                      </th>
                    ))}
                    <th scope="col">{t("words.hint.total")}</th>
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
