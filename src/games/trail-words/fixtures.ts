import { pickDailyTrailPuzzle } from "./daily";
import { buildTrailPuzzle } from "./puzzle";
import { readRealWordList } from "./testing";
import { scoreWord } from "./analysis";

const { code, tier } = pickDailyTrailPuzzle(0);

export const puzzle = buildTrailPuzzle(code, tier, readRealWordList());

export const commonWords = [...puzzle.common];

export const pangram = puzzle.pangrams.find((word) => puzzle.common.has(word)) as string;

export const plainWord = commonWords.find(
  (word) => word.length === 4 && !puzzle.pangrams.includes(word),
) as string;

export function findWinningWords(): string[] {
  const needed = Math.ceil(puzzle.maxScore * 0.5);
  const words: string[] = [];
  let total = 0;
  commonWords.forEach((word) => {
    if (total < needed) {
      words.push(word);
      total += scoreWord(word, puzzle.letterMask);
    }
  });
  return words;
}
