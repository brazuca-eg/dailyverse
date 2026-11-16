import type { ReactNode } from "react";
import "./RulesPanel.css";

interface RulesPanelProps {
  steps: readonly ReactNode[];
  example?: ReactNode;
  onStart: () => void;
}

export function RulesPanel({ steps, example, onStart }: RulesPanelProps) {
  return (
    <div className="how-to-play">
      <ol className="steps">
        {steps.map((step, index) => (
          <li key={index}>{step}</li>
        ))}
      </ol>
      {example && (
        <div className="guess example" aria-hidden="true">
          {example}
        </div>
      )}
      <p className="how-to-play-note">A new puzzle arrives every day at 00:00 UTC.</p>
      <button type="button" className="button button-primary button-block" onClick={onStart}>
        Start playing
      </button>
    </div>
  );
}
