import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { createGameStorage } from "../core/gameStorage";
import { applyGuess, createGuessingState } from "../core/guessing";
import { requireCountry } from "../core/testing";
import { useGuessingSession } from "./useGuessingSession";

const storage = createGameStorage("test-game");
const PUZZLE_ID = "puzzle-1";
const answer = requireCountry("EG");
const DAY_INDEX = 1;
const wrongCodes = ["PE", "JP", "CH", "BR", "AU"];

function renderSession(dayIndex = DAY_INDEX) {
  return renderHook(() => useGuessingSession(storage, PUZZLE_ID, answer, dayIndex));
}

function guess(session: ReturnType<typeof renderSession>, code: string) {
  act(() => session.result.current.submitGuess(requireCountry(code)));
}

describe("useGuessingSession", () => {
  it("starts a fresh game with empty stats", () => {
    const { result } = renderSession();
    expect(result.current.state).toEqual({ puzzleId: PUZZLE_ID, guesses: [], status: "playing" });
    expect(result.current.stats.gamesPlayed).toBe(0);
  });

  it("records a wrong guess and saves the game", () => {
    const session = renderSession();
    guess(session, "PE");
    expect(session.result.current.state.guesses.map((entry) => entry.countryCode)).toEqual(["PE"]);
    expect(session.result.current.state.status).toBe("playing");
    expect(storage.findSavedState(PUZZLE_ID, DAY_INDEX)).toEqual(session.result.current.state);
  });

  it("does not touch the stats while the game is still going", () => {
    const session = renderSession();
    guess(session, "PE");
    expect(storage.loadStats().gamesPlayed).toBe(0);
  });

  it("wins on the correct answer and updates and saves the stats", () => {
    const session = renderSession();
    guess(session, "PE");
    guess(session, answer.code);
    expect(session.result.current.state.status).toBe("won");
    expect(session.result.current.stats).toMatchObject({
      gamesPlayed: 1,
      gamesWon: 1,
      currentStreak: 1,
      lastCompletedDay: DAY_INDEX,
    });
    expect(storage.loadStats()).toEqual(session.result.current.stats);
  });

  it("loses after five wrong guesses and records the loss", () => {
    const session = renderSession();
    wrongCodes.forEach((code) => guess(session, code));
    expect(session.result.current.state.status).toBe("lost");
    expect(session.result.current.stats).toMatchObject({
      gamesPlayed: 1,
      gamesWon: 0,
      currentStreak: 0,
    });
    expect(storage.loadStats().gamesPlayed).toBe(1);
  });

  it("restores a game saved earlier the same day", () => {
    const saved = applyGuess(createGuessingState(PUZZLE_ID), requireCountry("PE"), answer);
    storage.saveState(DAY_INDEX, saved);
    const { result } = renderSession();
    expect(result.current.state).toEqual(saved);
  });

  it("ignores a game saved on another day", () => {
    const saved = applyGuess(createGuessingState(PUZZLE_ID), requireCountry("PE"), answer);
    storage.saveState(DAY_INDEX - 1, saved);
    const { result } = renderSession();
    expect(result.current.state.guesses).toEqual([]);
  });

  it("does not count a finished game again when the page is reopened", () => {
    const first = renderSession();
    guess(first, answer.code);
    first.unmount();

    const reopened = renderSession();
    expect(reopened.result.current.state.status).toBe("won");
    expect(reopened.result.current.stats.gamesPlayed).toBe(1);
    expect(storage.loadStats().gamesPlayed).toBe(1);
  });

  it("builds a streak across consecutive days", () => {
    const dayOne = renderSession(1);
    guess(dayOne, answer.code);
    dayOne.unmount();

    const dayTwo = renderSession(2);
    guess(dayTwo, answer.code);
    expect(dayTwo.result.current.stats).toMatchObject({ currentStreak: 2, maxStreak: 2 });
  });

  it("rejects a repeated guess", () => {
    const session = renderSession();
    guess(session, "PE");
    expect(() => guess(session, "PE")).toThrow();
  });
});
