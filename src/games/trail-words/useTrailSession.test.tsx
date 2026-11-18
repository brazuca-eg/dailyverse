import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createMemoryStore } from "../../core/testing";
import { commonWords, findWinningWords, pangram, plainWord, puzzle } from "./fixtures";
import { trailWordsStorage } from "./persistence";
import { useTrailSession } from "./useTrailSession";

const DAY = 0;

function renderSession(day = DAY) {
  return renderHook(() => useTrailSession(trailWordsStorage, puzzle, day));
}

type Session = ReturnType<typeof renderSession>;

function typeWord(session: Session, word: string) {
  act(() => {
    [...word].forEach((letter) => session.result.current.type(letter));
  });
}

function play(session: Session, word: string) {
  act(() => {
    [...word].forEach((letter) => session.result.current.type(letter));
    session.result.current.submit();
  });
}

describe("useTrailSession", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("starts empty, with the letters in the puzzle's order", () => {
    const session = renderSession();
    expect(session.result.current.state.found).toEqual([]);
    expect(session.result.current.input).toBe("");
    expect(session.result.current.outer).toEqual(puzzle.outer);
    expect(session.result.current.toast).toBeNull();
  });

  it("types letters and deletes them", () => {
    const session = renderSession();
    typeWord(session, "cam");
    expect(session.result.current.input).toBe("cam");
    act(() => session.result.current.backspace());
    expect(session.result.current.input).toBe("ca");
  });

  it("uses every key even when they arrive before the next render", () => {
    const session = renderSession();
    play(session, plainWord);
    expect(session.result.current.state.found).toEqual([plainWord]);
  });

  it("accepts a word: clears the input, saves it and shows the points", () => {
    const session = renderSession();
    play(session, plainWord);
    const { state, input, toast } = session.result.current;
    expect(state.found).toEqual([plainWord]);
    expect(input).toBe("");
    expect(toast).toMatchObject({ text: "+1", tone: "good" });
    expect(trailWordsStorage.findSavedState(puzzle.code, DAY)?.found).toEqual([plainWord]);
  });

  it("celebrates a pangram", () => {
    const session = renderSession();
    play(session, pangram);
    expect(session.result.current.toast).toMatchObject({ tone: "pangram" });
    expect(session.result.current.toast?.text).toMatch(/^Pangram! \+\d+$/);
  });

  it("rejects a word with the reason, and clears the input", () => {
    const session = renderSession();
    play(session, "zz");
    expect(session.result.current.toast).toEqual({ id: 1, text: "Too short", tone: "bad" });
    expect(session.result.current.input).toBe("");
    expect(session.result.current.state.found).toEqual([]);
    play(session, plainWord);
    play(session, plainWord);
    expect(session.result.current.toast).toMatchObject({ text: "Already found", tone: "bad" });
    expect(session.result.current.state.found).toEqual([plainWord]);
  });

  it("gives every message its own id, so the same message can show twice", () => {
    const session = renderSession();
    play(session, "zz");
    const first = session.result.current.toast?.id;
    play(session, "zz");
    expect(session.result.current.toast?.id).not.toBe(first);
  });

  it("hides the message after a moment", () => {
    const session = renderSession();
    play(session, plainWord);
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(session.result.current.toast).not.toBeNull();
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(session.result.current.toast).toBeNull();
  });

  it("shuffles the outer letters without losing or adding any", () => {
    const session = renderSession();
    let changed = false;
    for (let attempt = 0; attempt < 10 && !changed; attempt += 1) {
      act(() => session.result.current.shuffleOuter());
      changed = session.result.current.outer.join("") !== puzzle.outer.join("");
      expect([...session.result.current.outer].sort()).toEqual([...puzzle.outer].sort());
    }
    expect(changed).toBe(true);
  });

  it("restores the words found when the page is opened again", () => {
    const first = renderSession();
    play(first, plainWord);
    first.unmount();
    expect(renderSession().result.current.state.found).toEqual([plainWord]);
  });

  it("starts fresh on another day", () => {
    const first = renderSession();
    play(first, plainWord);
    first.unmount();
    expect(renderSession(DAY + 1).result.current.state.found).toEqual([]);
  });

  it("drops saved words that are not in the puzzle", () => {
    trailWordsStorage.saveState(DAY, {
      puzzleId: puzzle.code,
      found: [plainWord, "zzzzz"],
      ended: false,
    });
    expect(renderSession().result.current.state.found).toEqual([plainWord]);
  });

  it("records a win once, when Ranger is reached, and keeps playing", () => {
    const session = renderSession();
    const winning = findWinningWords();
    winning.slice(0, -1).forEach((word) => play(session, word));
    expect(session.result.current.stats.gamesPlayed).toBe(0);
    play(session, winning[winning.length - 1]);
    expect(session.result.current.stats).toMatchObject({
      gamesPlayed: 1,
      gamesWon: 1,
      currentStreak: 1,
    });
    expect(session.result.current.state.ended).toBe(false);
    const extra = commonWords.find((word) => !winning.includes(word)) as string;
    play(session, extra);
    expect(session.result.current.state.found).toContain(extra);
    expect(session.result.current.stats.gamesPlayed).toBe(1);
    act(() => session.result.current.finish());
    expect(session.result.current.stats).toMatchObject({ gamesPlayed: 1, gamesWon: 1 });
    expect(trailWordsStorage.loadStats().gamesWon).toBe(1);
  });

  it("records a loss when the game is ended before Ranger", () => {
    const session = renderSession();
    play(session, plainWord);
    act(() => session.result.current.finish());
    expect(session.result.current.state.ended).toBe(true);
    expect(session.result.current.stats).toMatchObject({
      gamesPlayed: 1,
      gamesWon: 0,
      currentStreak: 0,
    });
    expect(trailWordsStorage.findSavedState(puzzle.code, DAY)?.ended).toBe(true);
  });

  it("ends only once, and accepts nothing afterwards", () => {
    const session = renderSession();
    act(() => session.result.current.finish());
    act(() => session.result.current.finish());
    expect(session.result.current.stats.gamesPlayed).toBe(1);
    typeWord(session, plainWord);
    expect(session.result.current.input).toBe("");
    act(() => session.result.current.submit());
    expect(session.result.current.state.found).toEqual([]);
  });

  it("works without storage", () => {
    const store = createMemoryStore();
    expect(
      trailWordsStorage.saveState(DAY, { puzzleId: "x", found: [], ended: false }, store),
    ).toBe(true);
    const session = renderSession();
    expect(() => play(session, plainWord)).not.toThrow();
  });
});
