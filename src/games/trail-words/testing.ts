import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parseWordList, type WordList } from "./words";

let cached: WordList | null = null;

export function readRealWordList(): WordList {
  if (cached === null) {
    cached = parseWordList(readFileSync(resolve("src/games/trail-words/words.txt"), "utf8"));
  }
  return cached;
}
