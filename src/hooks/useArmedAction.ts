import { useEffect, useRef, useState } from "react";

const DEFAULT_WINDOW_MS = 4000;

export interface ArmedAction {
  isArmed: boolean;
  trigger: () => void;
}

export function useArmedAction(action: () => void, windowMs = DEFAULT_WINDOW_MS): ArmedAction {
  const [isArmed, setIsArmed] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  function trigger() {
    window.clearTimeout(timer.current);
    if (isArmed) {
      setIsArmed(false);
      action();
      return;
    }
    setIsArmed(true);
    timer.current = window.setTimeout(() => setIsArmed(false), windowMs);
  }

  return { isArmed, trigger };
}
