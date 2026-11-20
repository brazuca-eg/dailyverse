import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { useLocaleData } from "./useLocaleData";

afterEach(() => {
  document.documentElement.lang = "";
});

describe("useLocaleData", () => {
  it("starts empty and then gives the data loaded for the page language", async () => {
    document.documentElement.lang = "de";
    const load = async (locale: string) => ({ locale });
    const { result } = renderHook(() => useLocaleData(load));
    expect(result.current).toBeNull();
    await waitFor(() => expect(result.current).toEqual({ locale: "de" }));
  });

  it("falls back to English when the page has no known language", async () => {
    const load = async (locale: string) => ({ locale });
    const { result } = renderHook(() => useLocaleData(load));
    await waitFor(() => expect(result.current).toEqual({ locale: "en" }));
  });

  it("stays empty when there is nothing for the language", async () => {
    const load = async () => null;
    const { result } = renderHook(() => useLocaleData(load));
    await Promise.resolve();
    expect(result.current).toBeNull();
  });

  it("ignores a result that arrives after the page was left", async () => {
    let finish: (value: { late: boolean }) => void = () => undefined;
    const load = () => new Promise<{ late: boolean }>((resolve) => (finish = resolve));
    const { result, unmount } = renderHook(() => useLocaleData(load));
    unmount();
    finish({ late: true });
    await Promise.resolve();
    expect(result.current).toBeNull();
  });
});
