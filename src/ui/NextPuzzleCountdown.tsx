import { useEffect, useState } from "react";
import { calculateMillisUntilNextDay, formatCountdown } from "../core/daily";
import { uiMessages as t } from "./messages";
import "./NextPuzzleCountdown.css";

export function NextPuzzleCountdown() {
  const [targetTime] = useState(() => Date.now() + calculateMillisUntilNextDay(new Date()));
  const [millisLeft, setMillisLeft] = useState(() => targetTime - Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setMillisLeft(targetTime - Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [targetTime]);

  if (millisLeft <= 0) {
    return (
      <button
        type="button"
        className="button button-secondary button-block"
        onClick={() => window.location.reload()}
      >
        {t("ui.countdown.play")}
      </button>
    );
  }

  return (
    <div className="countdown" role="timer">
      <span className="countdown-label">{t("ui.countdown.label")}</span>
      <span className="countdown-time">{formatCountdown(millisLeft)}</span>
    </div>
  );
}
