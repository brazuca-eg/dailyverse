export function formatElapsed(seconds: number): string {
  const whole = Math.floor(seconds);
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
}

export function pluralise(count: number, word: string): string {
  return `${count} ${word}${count === 1 ? "" : "s"}`;
}
