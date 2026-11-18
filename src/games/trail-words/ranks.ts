export interface Rank {
  name: string;
  share: number;
}

export interface RankProgress {
  rank: string;
  next: string | null;
  pointsToNext: number;
  threshold: number;
}

export const RANKS: readonly Rank[] = [
  { name: "Beginner", share: 0 },
  { name: "Hiker", share: 0.15 },
  { name: "Trekker", share: 0.3 },
  { name: "Ranger", share: 0.5 },
  { name: "Summit", share: 0.7 },
];

export const WIN_RANK = "Ranger";

export function calculateThreshold(rank: Rank, maxScore: number): number {
  return Math.ceil(rank.share * maxScore);
}

export function findRankProgress(score: number, maxScore: number): RankProgress {
  const reached = RANKS.filter((rank) => score >= calculateThreshold(rank, maxScore));
  const current = reached[reached.length - 1];
  const next = RANKS[reached.length] ?? null;
  return {
    rank: current.name,
    next: next ? next.name : null,
    pointsToNext: next ? calculateThreshold(next, maxScore) - score : 0,
    threshold: calculateThreshold(current, maxScore),
  };
}

export function hasReachedWinRank(score: number, maxScore: number): boolean {
  const win = RANKS.find((rank) => rank.name === WIN_RANK) as Rank;
  return maxScore > 0 && score >= calculateThreshold(win, maxScore);
}
