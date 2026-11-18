import { describe, expect, it } from "vitest";
import { loadWordList } from "./wordList";
import { readRealWordList } from "./testing";

describe("loadWordList", () => {
  it("loads and reads the word list", async () => {
    const list = await loadWordList();
    expect(list.words.length).toBeGreaterThan(60000);
    expect(list.accepted.has("trail")).toBe(true);
    expect(list.common.has("trail")).toBe(true);
  });

  it("gives the same promise every time, so the list is only fetched and read once", () => {
    expect(loadWordList()).toBe(loadWordList());
  });

  it("matches the list read straight from the file", async () => {
    const loaded = await loadWordList();
    const direct = readRealWordList();
    expect(loaded.words).toEqual(direct.words);
    expect(loaded.common.size).toBe(direct.common.size);
  });

  it("does not include the notice header as a word", async () => {
    const { accepted } = await loadWordList();
    expect([...accepted].some((word) => word.startsWith("#") || word.includes(" "))).toBe(false);
  });
});
