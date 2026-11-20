import { describe, expect, it } from "vitest";
import { buildDoneKey, formatUtcDate, isDoneToday, markDoneToday } from "./doneToday";
import { createMemoryStore } from "./testing";

const MORNING = new Date("2026-11-20T08:00:00Z");
const NEXT_MORNING = new Date("2026-11-21T00:00:01Z");

describe("doneToday", () => {
  it("is not done until the game is finished", () => {
    expect(isDoneToday("bear-sweeper", createMemoryStore(), MORNING)).toBe(false);
  });

  it("is done for the rest of the UTC day", () => {
    const store = createMemoryStore();
    markDoneToday("bear-sweeper", store, MORNING);
    expect(isDoneToday("bear-sweeper", store, new Date("2026-11-20T23:59:59Z"))).toBe(true);
  });

  it("is not done any more on the next day", () => {
    const store = createMemoryStore();
    markDoneToday("bear-sweeper", store, MORNING);
    expect(isDoneToday("bear-sweeper", store, NEXT_MORNING)).toBe(false);
  });

  it("keeps each game apart", () => {
    const store = createMemoryStore();
    markDoneToday("bear-sweeper", store, MORNING);
    expect(isDoneToday("switchback", store, MORNING)).toBe(false);
  });

  it("uses its own key for each game", () => {
    expect(buildDoneKey("peak-order")).toBe("dailyverse:peak-order:last-finished");
  });

  it("ignores a stored value that is not a date", () => {
    const store = createMemoryStore({ [buildDoneKey("x")]: '"yesterday"' });
    expect(isDoneToday("x", store, MORNING)).toBe(false);
    expect(isDoneToday("x", createMemoryStore({ [buildDoneKey("x")]: "{" }), MORNING)).toBe(false);
  });

  it("formats a date as year, month and day in UTC", () => {
    expect(formatUtcDate(new Date("2026-01-02T23:30:00-05:00"))).toBe("2026-01-03");
  });

  it("reports whether saving worked", () => {
    expect(markDoneToday("x", null, MORNING)).toBe(false);
  });
});
