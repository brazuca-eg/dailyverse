import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { hasSeenHelp, markHelpSeen } from "./persistence";
import { useHelpDialog } from "./useHelpDialog";

describe("useHelpDialog", () => {
  it("opens for a first-time visitor who has not started playing", () => {
    const { result } = renderHook(() => useHelpDialog(false));
    expect(result.current.isOpen).toBe(true);
  });

  it("stays closed once the help has been seen", () => {
    markHelpSeen();
    const { result } = renderHook(() => useHelpDialog(false));
    expect(result.current.isOpen).toBe(false);
  });

  it("stays closed when the player has already started a game", () => {
    const { result } = renderHook(() => useHelpDialog(true));
    expect(result.current.isOpen).toBe(false);
    expect(hasSeenHelp()).toBe(false);
  });

  it("closes and remembers that the help was seen", () => {
    const { result } = renderHook(() => useHelpDialog(false));
    act(() => result.current.close());
    expect(result.current.isOpen).toBe(false);
    expect(hasSeenHelp()).toBe(true);
  });

  it("can be opened again on request", () => {
    const { result } = renderHook(() => useHelpDialog(false));
    act(() => result.current.close());
    act(() => result.current.open());
    expect(result.current.isOpen).toBe(true);
  });

  it("does not reopen on the next visit after being closed", () => {
    const first = renderHook(() => useHelpDialog(false));
    act(() => first.result.current.close());
    first.unmount();

    const next = renderHook(() => useHelpDialog(false));
    expect(next.result.current.isOpen).toBe(false);
  });
});
