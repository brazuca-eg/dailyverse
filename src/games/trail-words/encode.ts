import { LETTER_COUNT, countLetters, toLetterMask } from "./words";

export interface PuzzleLetters {
  centre: string;
  outer: readonly string[];
  letterMask: number;
  centreBit: number;
}

const FIRST_CODE = 97;

function toLetter(bit: number): string {
  return String.fromCharCode(FIRST_CODE + bit);
}

export function encodePuzzle(letterMask: number, centreBit: number): string {
  const outer = Array.from({ length: 26 }, (_, bit) => bit)
    .filter((bit) => (letterMask >> bit) & 1 && bit !== centreBit)
    .map(toLetter);
  return `${toLetter(centreBit)}${outer.join("")}`;
}

export function decodePuzzle(code: string): PuzzleLetters {
  const letterMask = toLetterMask(code);
  if (
    !/^[a-z]+$/.test(code) ||
    code.length !== LETTER_COUNT ||
    countLetters(letterMask) !== LETTER_COUNT
  ) {
    throw new Error(`"${code}" is not seven different letters`);
  }
  return {
    centre: code[0],
    outer: Array.from(code.slice(1)),
    letterMask,
    centreBit: code.charCodeAt(0) - FIRST_CODE,
  };
}
