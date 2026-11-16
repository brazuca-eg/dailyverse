import type { TentsState } from "./game";

export function formatElapsed(seconds: number): string {
  const whole = Math.floor(seconds);
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
}

function pluralise(count: number, word: string): string {
  return `${count} ${word}${count === 1 ? "" : "s"}`;
}

export function buildShareText(
  state: TentsState,
  size: number,
  puzzleNumber: number,
  url?: string,
): string {
  const result = state.status === "won" ? "⛺" : "gave up";
  const lines = [
    `Dailyverse Tents and Trees #${puzzleNumber} ${size}x${size} ${result}`,
    `⏱ ${formatElapsed(state.elapsedSeconds)} · 🔎 ${pluralise(state.checks, "check")} · 💡 ${pluralise(state.hints, "hint")}`,
  ];
  if (url) {
    lines.push(url);
  }
  return lines.join("\n");
}
