export const DIFFICULTIES = ["easy", "medium", "hard"] as const;

export type Difficulty = (typeof DIFFICULTIES)[number];

export const WEEKLY_DIFFICULTY_PATTERN: readonly Difficulty[] = [
  "easy",
  "medium",
  "hard",
  "medium",
  "easy",
  "medium",
  "hard",
];

export const FALLBACK_ORDER: Readonly<Record<Difficulty, readonly Difficulty[]>> = {
  easy: ["easy", "medium", "hard"],
  medium: ["medium", "hard", "easy"],
  hard: ["hard", "medium", "easy"],
};
