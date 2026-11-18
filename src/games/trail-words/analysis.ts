import { countLetters, LETTER_COUNT, MIN_WORD_LENGTH, toLetterMask } from "./words";

const PANGRAM_BONUS = 7;
const EXCLUDED_LETTER = "s";

export type WordIndex = ReadonlyMap<number, readonly string[]>;

export interface PuzzleMetrics {
  words: number;
  commonWords: number;
  commonPangrams: number;
  allPangrams: number;
  fourLetterShare: number;
  maxScore: number;
}

export function indexWords(words: readonly string[]): WordIndex {
  const index = new Map<number, string[]>();
  words.forEach((word) => {
    const mask = toLetterMask(word);
    index.set(mask, [...(index.get(mask) ?? []), word]);
  });
  return index;
}

export function listLetters(mask: number): number[] {
  return Array.from({ length: 26 }, (_, bit) => bit).filter((bit) => (mask >> bit) & 1);
}

function listSubmasks(mask: number): number[] {
  const bits = listLetters(mask);
  return Array.from({ length: (1 << bits.length) - 1 }, (_, count) => count + 1).map((pick) =>
    bits.reduce((sub, bit, position) => ((pick >> position) & 1 ? sub | (1 << bit) : sub), 0),
  );
}

export function listWordsForLetters(index: WordIndex, letterMask: number): string[] {
  return listSubmasks(letterMask).flatMap((sub) => index.get(sub) ?? []);
}

export function scoreWord(word: string, letterMask: number): number {
  if (word.length === MIN_WORD_LENGTH) {
    return 1;
  }
  return word.length + (toLetterMask(word) === letterMask ? PANGRAM_BONUS : 0);
}

export function findPangramSets(index: WordIndex, common: ReadonlySet<string>): number[] {
  const excluded = toLetterMask(EXCLUDED_LETTER);
  return [...index.entries()]
    .filter(
      ([mask, words]) =>
        countLetters(mask) === LETTER_COUNT &&
        (mask & excluded) === 0 &&
        words.some((word) => common.has(word)),
    )
    .map(([mask]) => mask)
    .sort((a, b) => a - b);
}

export function measurePuzzle(
  words: readonly string[],
  letterMask: number,
  centreBit: number,
  common: ReadonlySet<string>,
): PuzzleMetrics {
  const usable = words.filter((word) => (toLetterMask(word) >> centreBit) & 1);
  const easy = usable.filter((word) => common.has(word));
  const isPangram = (word: string) => toLetterMask(word) === letterMask;
  return {
    words: usable.length,
    commonWords: easy.length,
    commonPangrams: easy.filter(isPangram).length,
    allPangrams: usable.filter(isPangram).length,
    fourLetterShare:
      easy.length === 0
        ? 0
        : easy.filter((word) => word.length === MIN_WORD_LENGTH).length / easy.length,
    maxScore: easy.reduce((total, word) => total + scoreWord(word, letterMask), 0),
  };
}
