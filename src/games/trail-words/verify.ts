import { indexWords, listWordsForLetters, measurePuzzle } from "./analysis";
import { decodePuzzle } from "./encode";
import { expandBlocklist } from "./filter";
import { fitsTier, TRAIL_TIERS, type TrailTier } from "./tiers";
import { isAnswerable, parseWordList, toLetterMask } from "./words";

export const MIN_POOL_SIZE = 1000;

function checkWords(wordText: string): string[] {
  const { words } = parseWordList(wordText);
  const blocked = expandBlocklist([]);
  const notAnswerable = words.filter((word) => !isAnswerable(word));
  const forbidden = words.filter((word) => blocked.has(word));
  return [
    ...notAnswerable
      .slice(0, 5)
      .map((word) => `"${word}" is in the word list but cannot be an answer`),
    ...forbidden.slice(0, 5).map((word) => `"${word}" is blocked but still in the word list`),
    ...(new Set(words).size === words.length ? [] : ["the word list has duplicates"]),
  ];
}

function checkPuzzle(
  code: string,
  tier: TrailTier,
  wordText: string,
  cache: PuzzleCache,
): string[] {
  try {
    const { letterMask, centreBit } = decodePuzzle(code);
    if (letterMask & toLetterMask("s")) {
      return [`${tier} ${code}: contains the letter s`];
    }
    const metrics = measurePuzzle(
      listWordsForLetters(cache.getIndex(wordText), letterMask),
      letterMask,
      centreBit,
      cache.getCommon(wordText),
    );
    return fitsTier(metrics, tier) ? [] : [`${tier} ${code}: does not fit the ${tier} rules`];
  } catch (error) {
    return [`${tier} ${code}: ${(error as Error).message}`];
  }
}

class PuzzleCache {
  private text = "";
  private index: ReturnType<typeof indexWords> | null = null;
  private common: ReadonlySet<string> = new Set();

  private load(wordText: string): void {
    if (this.text !== wordText || this.index === null) {
      const list = parseWordList(wordText);
      this.text = wordText;
      this.index = indexWords(list.words);
      this.common = list.common;
    }
  }

  getIndex(wordText: string) {
    this.load(wordText);
    return this.index as ReturnType<typeof indexWords>;
  }

  getCommon(wordText: string): ReadonlySet<string> {
    this.load(wordText);
    return this.common;
  }
}

export function verifyTrailData(
  wordText: string,
  puzzles: Readonly<Record<TrailTier, readonly string[]>>,
): string[] {
  const cache = new PuzzleCache();
  const all = TRAIL_TIERS.flatMap((tier) => puzzles[tier]);
  const duplicates = all.filter((code, index) => all.indexOf(code) !== index);
  return [
    ...checkWords(wordText),
    ...TRAIL_TIERS.flatMap((tier) =>
      puzzles[tier].length < MIN_POOL_SIZE
        ? [`${tier} has only ${puzzles[tier].length} puzzles, fewer than ${MIN_POOL_SIZE}`]
        : [],
    ),
    ...duplicates.slice(0, 5).map((code) => `${code} appears more than once`),
    ...TRAIL_TIERS.flatMap((tier) =>
      puzzles[tier].flatMap((code) => checkPuzzle(code, tier, wordText, cache)),
    ),
  ];
}
