export function readRetryAfterSeconds(headerValue: string | null, fallbackSeconds: number): number {
  const seconds = Number(headerValue);
  return Number.isFinite(seconds) && seconds > 0 ? seconds : fallbackSeconds;
}
