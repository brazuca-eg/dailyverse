import { decodePuzzle } from "./encode";
import { scoreWord } from "./analysis";
import type { TrailTier } from "./tiers";
import { toLetterMask, type WordList } from "./words";

export interface TrailPuzzle {
  code: string;
  tier: TrailTier;
  centre: string;
  outer: readonly string[];
  letterMask: number;
  centreBit: number;
  words: readonly string[];
  common: ReadonlySet<string>;
  pangrams: readonly string[];
  maxScore: number;
}

export function listPuzzleWords(
  words: readonly string[],
  letterMask: number,
  centreBit: number,
): string[] {
  const centre = 1 << centreBit;
  return words.filter((word) => {
    const mask = toLetterMask(word);
    return (mask & ~letterMask) === 0 && (mask & centre) !== 0;
  });
}

export function buildTrailPuzzle(code: string, tier: TrailTier, list: WordList): TrailPuzzle {
  const letters = decodePuzzle(code);
  const words = listPuzzleWords(list.words, letters.letterMask, letters.centreBit).sort();
  const common = new Set(words.filter((word) => list.common.has(word)));
  return {
    code,
    tier,
    centre: letters.centre,
    outer: letters.outer,
    letterMask: letters.letterMask,
    centreBit: letters.centreBit,
    words,
    common,
    pangrams: words.filter((word) => toLetterMask(word) === letters.letterMask),
    maxScore: [...common].reduce((total, word) => total + scoreWord(word, letters.letterMask), 0),
  };
}
