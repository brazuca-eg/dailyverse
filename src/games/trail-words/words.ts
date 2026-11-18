export const MIN_WORD_LENGTH = 4;
export const LETTER_COUNT = 7;

const COMMON_MARK = "*";
const HEADER_MARK = "#";
const ANSWERABLE = /^[a-z]+$/;

export interface WordList {
  words: readonly string[];
  accepted: ReadonlySet<string>;
  common: ReadonlySet<string>;
}

export function toLetterMask(word: string): number {
  return Array.from(word).reduce((mask, letter) => mask | (1 << (letter.charCodeAt(0) - 97)), 0);
}

export function countLetters(mask: number): number {
  let remaining = mask;
  let count = 0;
  while (remaining > 0) {
    count += remaining & 1;
    remaining >>>= 1;
  }
  return count;
}

export function isAnswerable(word: string): boolean {
  return (
    word.length >= MIN_WORD_LENGTH &&
    ANSWERABLE.test(word) &&
    countLetters(toLetterMask(word)) <= LETTER_COUNT
  );
}

export function parseWordList(text: string): WordList {
  const entries = text.split("\n").filter((line) => line !== "" && !line.startsWith(HEADER_MARK));
  const words = entries.map((entry) => (entry.endsWith(COMMON_MARK) ? entry.slice(0, -1) : entry));
  return {
    words,
    accepted: new Set(words),
    common: new Set(
      entries.filter((entry) => entry.endsWith(COMMON_MARK)).map((entry) => entry.slice(0, -1)),
    ),
  };
}

export function formatWordList(
  words: readonly string[],
  common: ReadonlySet<string>,
  notice: readonly string[],
): string {
  const header = notice.map((line) => `${HEADER_MARK} ${line}`.trimEnd());
  const body = [...words].sort().map((word) => (common.has(word) ? `${word}${COMMON_MARK}` : word));
  return `${[...header, ...body].join("\n")}\n`;
}
