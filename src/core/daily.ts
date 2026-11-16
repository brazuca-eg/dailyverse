const MILLIS_PER_DAY = 24 * 60 * 60 * 1000;

function toUtcDayStart(date: Date): number {
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

export function calculateDaysSinceLaunch(today: Date, launchDate: Date): number {
  return Math.floor((toUtcDayStart(today) - toUtcDayStart(launchDate)) / MILLIS_PER_DAY);
}

export function calculateMillisUntilNextDay(now: Date): number {
  return toUtcDayStart(now) + MILLIS_PER_DAY - now.getTime();
}

export function formatCountdown(millis: number): string {
  const totalSeconds = Math.max(0, Math.floor(millis / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds].map((part) => String(part).padStart(2, "0")).join(":");
}

export function pickDailyItem<T>(items: readonly T[], daysSinceLaunch: number): T {
  if (items.length === 0) {
    throw new Error("Cannot pick a daily item from an empty list");
  }
  const index = ((daysSinceLaunch % items.length) + items.length) % items.length;
  return items[index];
}
