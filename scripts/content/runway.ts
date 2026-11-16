export function calculateRunwayDays(puzzleCount: number, daysSinceLaunch: number): number {
  if (daysSinceLaunch < 0) {
    return puzzleCount;
  }
  return Math.max(0, puzzleCount - 1 - daysSinceLaunch);
}
