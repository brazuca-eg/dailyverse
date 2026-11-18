import { parseWordList, type WordList } from "./words";

let loading: Promise<WordList> | null = null;

export function loadWordList(): Promise<WordList> {
  if (loading === null) {
    loading = import("./words.txt?raw").then((module) => parseWordList(module.default));
  }
  return loading;
}
