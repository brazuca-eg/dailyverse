import { useEffect, useRef } from "react";

interface TrailKeyboardActions {
  onLetter: (key: string) => void;
  onBackspace: () => void;
  onSubmit: () => void;
}

const INTERACTIVE = "button, summary, a, input, textarea, select";

function isIgnored(event: KeyboardEvent): boolean {
  const target = event.target instanceof Element ? event.target : null;
  const isOnControl = target !== null && target.closest(INTERACTIVE) !== null;
  const isTypingKey = /^[a-zA-Z]$/.test(event.key) || event.key === "Backspace";
  return (
    event.ctrlKey ||
    event.metaKey ||
    event.altKey ||
    document.querySelector("dialog[open]") !== null ||
    (isOnControl && !isTypingKey) ||
    (target?.closest("input, textarea, select") ?? null) !== null
  );
}

export function useTrailKeyboard(actions: TrailKeyboardActions) {
  const latest = useRef(actions);

  useEffect(() => {
    latest.current = actions;
  });

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (isIgnored(event)) {
        return;
      }
      if (event.key === "Enter") {
        event.preventDefault();
        latest.current.onSubmit();
      } else if (event.key === "Backspace") {
        event.preventDefault();
        latest.current.onBackspace();
      } else if (/^[a-zA-Z]$/.test(event.key)) {
        latest.current.onLetter(event.key);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);
}
