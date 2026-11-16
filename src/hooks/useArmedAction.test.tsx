import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useArmedAction } from "./useArmedAction";

describe("useArmedAction", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("does nothing on the first trigger except arm itself", () => {
    const action = vi.fn();
    const { result } = renderHook(() => useArmedAction(action));
    expect(result.current.isArmed).toBe(false);
    act(() => result.current.trigger());
    expect(result.current.isArmed).toBe(true);
    expect(action).not.toHaveBeenCalled();
  });

  it("runs the action on the second trigger and disarms", () => {
    const action = vi.fn();
    const { result } = renderHook(() => useArmedAction(action));
    act(() => result.current.trigger());
    act(() => result.current.trigger());
    expect(action).toHaveBeenCalledTimes(1);
    expect(result.current.isArmed).toBe(false);
  });

  it("disarms by itself after the window, so a late trigger only arms again", () => {
    const action = vi.fn();
    const { result } = renderHook(() => useArmedAction(action, 1000));
    act(() => result.current.trigger());
    act(() => {
      vi.advanceTimersByTime(999);
    });
    expect(result.current.isArmed).toBe(true);
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current.isArmed).toBe(false);
    act(() => result.current.trigger());
    expect(action).not.toHaveBeenCalled();
    expect(result.current.isArmed).toBe(true);
  });

  it("waits four seconds by default", () => {
    const { result } = renderHook(() => useArmedAction(vi.fn()));
    act(() => result.current.trigger());
    act(() => {
      vi.advanceTimersByTime(3999);
    });
    expect(result.current.isArmed).toBe(true);
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current.isArmed).toBe(false);
  });

  it("restarts the window each time it is armed", () => {
    const { result } = renderHook(() => useArmedAction(vi.fn(), 1000));
    act(() => result.current.trigger());
    act(() => {
      vi.advanceTimersByTime(900);
    });
    expect(result.current.isArmed).toBe(true);
  });

  it("clears its timer when it goes away", () => {
    const { result, unmount } = renderHook(() => useArmedAction(vi.fn(), 1000));
    act(() => result.current.trigger());
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});
