import { renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useTodaysItem } from "./useTodaysItem";

const LAUNCH_DATE = new Date("2026-11-15T00:00:00Z");
const items = ["a", "b", "c"];

describe("useTodaysItem", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns the item for the number of days since launch", () => {
    vi.setSystemTime(new Date("2026-11-16T10:00:00Z"));
    const { result } = renderHook(() => useTodaysItem(items, LAUNCH_DATE));
    expect(result.current).toEqual({ dayIndex: 1, item: "b" });
  });

  it("starts over after the last item", () => {
    vi.setSystemTime(new Date("2026-11-18T10:00:00Z"));
    const { result } = renderHook(() => useTodaysItem(items, LAUNCH_DATE));
    expect(result.current).toEqual({ dayIndex: 3, item: "a" });
  });

  it("keeps the same item when the clock passes midnight during a session", () => {
    vi.setSystemTime(new Date("2026-11-16T23:59:59Z"));
    const { result, rerender } = renderHook(() => useTodaysItem(items, LAUNCH_DATE));
    const before = result.current;
    vi.setSystemTime(new Date("2026-11-17T00:00:05Z"));
    rerender();
    expect(result.current).toBe(before);
  });
});
