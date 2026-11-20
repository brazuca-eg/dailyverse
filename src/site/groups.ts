export interface GameGroup {
  id: "world" | "logic" | "memory";
  slugs: readonly string[];
}

export const GAME_GROUPS: readonly GameGroup[] = [
  { id: "world", slugs: ["mystery-place", "flag-fragment", "peak-order", "trail-words"] },
  { id: "logic", slugs: ["trail-sudoku", "tents-and-trees", "switchback", "bear-sweeper"] },
  { id: "memory", slugs: ["spot-the-difference", "weather-window"] },
];
