import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { createGameStorage } from "../core/gameStorage";
import { recordPlay } from "../core/history";
import { applyGameResult, createEmptyStats } from "../core/streak";
import { useHelpDialog } from "./useHelpDialog";

const storage = createGameStorage("test-game");

describe("useHelpDialog", () => {
  it("opens for a first-time visitor who has not started playing", () => {
    const { result } = renderHook(() => useHelpDialog(storage, false));
    expect(result.current.isOpen).toBe(true);
  });

  it("stays closed once the help has been seen", () => {
    storage.markHelpSeen();
    const { result } = renderHook(() => useHelpDialog(storage, false));
    expect(result.current.isOpen).toBe(false);
  });

  it("stays closed when the player has already started a game, and remembers it", () => {
    const { result } = renderHook(() => useHelpDialog(storage, true));
    expect(result.current.isOpen).toBe(false);
    expect(storage.hasSeenHelp()).toBe(true);
  });

  it("does not show the help on a later day to a player who started playing without closing it", () => {
    const first = renderHook(() => useHelpDialog(storage, true));
    first.unmount();
    const nextDay = renderHook(() => useHelpDialog(storage, false));
    expect(nextDay.result.current.isOpen).toBe(false);
  });

  it("does not show the help to a player who has finished a game before", () => {
    storage.saveStats(applyGameResult(createEmptyStats(), 3, false));
    const { result } = renderHook(() => useHelpDialog(storage, false));
    expect(result.current.isOpen).toBe(false);
  });

  it("does not show the help to a player with a play history for this game", () => {
    recordPlay({ game: "test-game", score: 2, maxScore: 5, won: true });
    const { result } = renderHook(() => useHelpDialog(storage, false));
    expect(result.current.isOpen).toBe(false);
  });

  it("still shows the help when only another game was played", () => {
    recordPlay({ game: "other-game", score: 2, maxScore: 5, won: true });
    const { result } = renderHook(() => useHelpDialog(storage, false));
    expect(result.current.isOpen).toBe(true);
  });

  it("closes and remembers that the help was seen", () => {
    const { result } = renderHook(() => useHelpDialog(storage, false));
    act(() => result.current.close());
    expect(result.current.isOpen).toBe(false);
    expect(storage.hasSeenHelp()).toBe(true);
  });

  it("can be opened again on request", () => {
    const { result } = renderHook(() => useHelpDialog(storage, false));
    act(() => result.current.close());
    act(() => result.current.open());
    expect(result.current.isOpen).toBe(true);
  });

  it("does not reopen on the next visit after being closed", () => {
    const first = renderHook(() => useHelpDialog(storage, false));
    act(() => first.result.current.close());
    first.unmount();

    const next = renderHook(() => useHelpDialog(storage, false));
    expect(next.result.current.isOpen).toBe(false);
  });
});
