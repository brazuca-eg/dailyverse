import { renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useDayIndex } from "./useDayIndex";

const LAUNCH_DATE = new Date("2026-11-15T00:00:00Z");

describe("useDayIndex", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("counts the days since launch, starting at zero on launch day", () => {
    vi.setSystemTime(new Date("2026-11-15T08:00:00Z"));
    expect(renderHook(() => useDayIndex(LAUNCH_DATE)).result.current).toBe(0);
    vi.setSystemTime(new Date("2026-11-19T23:59:59Z"));
    expect(renderHook(() => useDayIndex(LAUNCH_DATE)).result.current).toBe(4);
  });

  it("stays on the same day when the clock passes midnight during a session", () => {
    vi.setSystemTime(new Date("2026-11-16T23:59:59Z"));
    const { result, rerender } = renderHook(() => useDayIndex(LAUNCH_DATE));
    vi.setSystemTime(new Date("2026-11-17T00:00:05Z"));
    rerender();
    expect(result.current).toBe(1);
  });

  it("is negative before the launch", () => {
    vi.setSystemTime(new Date("2026-11-13T12:00:00Z"));
    expect(renderHook(() => useDayIndex(LAUNCH_DATE)).result.current).toBe(-2);
  });
});
