import type { ReactNode } from "react";
import { uiMessages as t } from "./messages";
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
      <p className="how-to-play-note">{t("ui.rules.note")}</p>
      <button type="button" className="button button-primary button-block" onClick={onStart}>
        {t("ui.rules.start")}
      </button>
    </div>
  );
}
