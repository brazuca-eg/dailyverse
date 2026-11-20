import { describe, expect, it } from "vitest";
import { HISTORY_KEY, MAX_RECORDS, isPlayRecord, loadHistory, recordPlay } from "./history";
import { createMemoryStore } from "./testing";

const DAY = new Date("2026-11-20T10:00:00Z");
const NEXT_DAY = new Date("2026-11-21T10:00:00Z");
const win = { game: "bear-sweeper", score: 4, maxScore: 5, won: true };

describe("recordPlay and loadHistory", () => {
  it("starts empty", () => {
    expect(loadHistory(createMemoryStore())).toEqual([]);
  });

  it("stores a finished game with the UTC date", () => {
    const store = createMemoryStore();
    expect(recordPlay(win, store, DAY)).toBe(true);
    expect(loadHistory(store)).toEqual([{ ...win, date: "2026-11-20" }]);
  });

  it("keeps one record per game and day, the latest one", () => {
    const store = createMemoryStore();
    recordPlay(win, store, DAY);
    recordPlay({ ...win, score: 2 }, store, DAY);
    expect(loadHistory(store)).toEqual([{ ...win, score: 2, date: "2026-11-20" }]);
  });

  it("keeps different games and different days apart", () => {
    const store = createMemoryStore();
    recordPlay(win, store, DAY);
    recordPlay({ ...win, game: "switchback" }, store, DAY);
    recordPlay(win, store, NEXT_DAY);
    expect(loadHistory(store)).toHaveLength(3);
  });

  it("keeps only the most recent records", () => {
    const store = createMemoryStore();
    const old = Array.from({ length: MAX_RECORDS }, (_, index) => ({
      ...win,
      game: `g${index}`,
      date: "2026-01-01",
    }));
    store.setItem(HISTORY_KEY, JSON.stringify(old));
    recordPlay(win, store, DAY);
    const history = loadHistory(store);
    expect(history).toHaveLength(MAX_RECORDS);
    expect(history[history.length - 1].game).toBe("bear-sweeper");
    expect(history[0].game).toBe("g1");
  });

  it("ignores a stored history that is broken", () => {
    expect(loadHistory(createMemoryStore({ [HISTORY_KEY]: "{" }))).toEqual([]);
    expect(loadHistory(createMemoryStore({ [HISTORY_KEY]: '[{"game":1}]' }))).toEqual([]);
    expect(loadHistory(createMemoryStore({ [HISTORY_KEY]: '{"a":1}' }))).toEqual([]);
  });

  it("reports that saving failed without storage", () => {
    expect(recordPlay(win, null, DAY)).toBe(false);
  });
});

describe("isPlayRecord", () => {
  const valid = { ...win, date: "2026-11-20" };

  it("accepts a valid record", () => {
    expect(isPlayRecord(valid)).toBe(true);
    expect(isPlayRecord({ ...valid, score: 0, won: false })).toBe(true);
  });

  it("rejects a record with a wrong field", () => {
    expect(isPlayRecord(null)).toBe(false);
    expect(isPlayRecord({ ...valid, game: 3 })).toBe(false);
    expect(isPlayRecord({ ...valid, date: "yesterday" })).toBe(false);
    expect(isPlayRecord({ ...valid, date: "2026-1-2" })).toBe(false);
    expect(isPlayRecord({ ...valid, score: -1 })).toBe(false);
    expect(isPlayRecord({ ...valid, maxScore: 0 })).toBe(false);
    expect(isPlayRecord({ ...valid, won: "yes" })).toBe(false);
  });
});
