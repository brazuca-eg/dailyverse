import { describe, expect, it } from "vitest";
import { isRecord } from "./guards";
import { findStoredValue, saveStoredValue, type KeyValueStore } from "./storage";
import { createMemoryStore } from "./testing";

function isNumberRecord(value: unknown): value is { n: number } {
  return isRecord(value) && typeof value.n === "number";
}

describe("saveStoredValue and findStoredValue", () => {
  it("round-trips a valid value", () => {
    const store = createMemoryStore();
    expect(saveStoredValue("k", { n: 3 }, store)).toBe(true);
    expect(findStoredValue("k", isNumberRecord, store)).toEqual({ n: 3 });
  });

  it("returns null for a missing key", () => {
    expect(findStoredValue("missing", isNumberRecord, createMemoryStore())).toBeNull();
  });

  it("returns null for invalid JSON", () => {
    const store = createMemoryStore({ k: "{not json" });
    expect(findStoredValue("k", isNumberRecord, store)).toBeNull();
  });

  it("returns null when the value fails validation", () => {
    const store = createMemoryStore({ k: JSON.stringify({ n: "three" }) });
    expect(findStoredValue("k", isNumberRecord, store)).toBeNull();
  });

  it("survives a store that throws", () => {
    const throwingStore: KeyValueStore = {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("quota");
      },
    };
    expect(findStoredValue("k", isNumberRecord, throwingStore)).toBeNull();
    expect(saveStoredValue("k", { n: 1 }, throwingStore)).toBe(false);
  });

  it("does nothing without a store", () => {
    expect(findStoredValue("k", isNumberRecord, null)).toBeNull();
    expect(saveStoredValue("k", { n: 1 }, null)).toBe(false);
  });
});
