import { describe, expect, it } from "vitest";
import {
  calculateDaysSinceLaunch,
  calculateMillisUntilNextDay,
  formatCountdown,
  pickDailyItem,
  pickDailySpec,
} from "./daily";
import { WEEKLY_DIFFICULTY_PATTERN } from "./difficulty";

const launchDate = new Date("2026-11-16T00:00:00Z");

describe("calculateDaysSinceLaunch", () => {
  it("is 0 on launch day", () => {
    expect(calculateDaysSinceLaunch(new Date("2026-11-16T00:00:00Z"), launchDate)).toBe(0);
  });

  it("ignores the time of day", () => {
    expect(calculateDaysSinceLaunch(new Date("2026-11-16T23:59:59Z"), launchDate)).toBe(0);
    expect(calculateDaysSinceLaunch(new Date("2026-11-17T00:00:00Z"), launchDate)).toBe(1);
  });

  it("counts whole days across a month boundary", () => {
    expect(calculateDaysSinceLaunch(new Date("2026-12-01T12:00:00Z"), launchDate)).toBe(15);
  });

  it("is negative before launch", () => {
    expect(calculateDaysSinceLaunch(new Date("2026-11-15T12:00:00Z"), launchDate)).toBe(-1);
  });
});

describe("calculateMillisUntilNextDay", () => {
  it("is a full day at UTC midnight", () => {
    expect(calculateMillisUntilNextDay(new Date("2026-11-16T00:00:00Z"))).toBe(86_400_000);
  });

  it("counts down to the next UTC midnight", () => {
    expect(calculateMillisUntilNextDay(new Date("2026-11-16T18:00:00Z"))).toBe(6 * 3_600_000);
    expect(calculateMillisUntilNextDay(new Date("2026-11-16T23:59:59Z"))).toBe(1000);
  });

  it("crosses month and year boundaries", () => {
    expect(calculateMillisUntilNextDay(new Date("2026-12-31T23:00:00Z"))).toBe(3_600_000);
  });
});

describe("formatCountdown", () => {
  it("formats hours, minutes and seconds with padding", () => {
    expect(formatCountdown(86_400_000)).toBe("24:00:00");
    expect(formatCountdown(3_661_000)).toBe("01:01:01");
    expect(formatCountdown(1000)).toBe("00:00:01");
  });

  it("rounds partial seconds down", () => {
    expect(formatCountdown(1999)).toBe("00:00:01");
  });

  it("never goes below zero", () => {
    expect(formatCountdown(0)).toBe("00:00:00");
    expect(formatCountdown(-5000)).toBe("00:00:00");
  });
});

describe("pickDailyItem", () => {
  const items = ["a", "b", "c"];

  it("picks by position", () => {
    expect(pickDailyItem(items, 0)).toBe("a");
    expect(pickDailyItem(items, 1)).toBe("b");
    expect(pickDailyItem(items, 2)).toBe("c");
  });

  it("wraps around after the last item", () => {
    expect(pickDailyItem(items, 3)).toBe("a");
    expect(pickDailyItem(items, 7)).toBe("b");
  });

  it("wraps for days before launch", () => {
    expect(pickDailyItem(items, -1)).toBe("c");
    expect(pickDailyItem(items, -3)).toBe("a");
  });

  it("throws for an empty list", () => {
    expect(() => pickDailyItem([], 0)).toThrow();
  });
});

describe("pickDailySpec", () => {
  it("adds the offset to the day number to get the seed", () => {
    expect(pickDailySpec(0, 1000).seed).toBe(1000);
    expect(pickDailySpec(5, 2000).seed).toBe(2005);
  });

  it("follows the weekly pattern for the tier, week after week", () => {
    Array.from({ length: 21 }, (_, day) => day).forEach((day) => {
      expect(pickDailySpec(day, 0).tier).toBe(
        WEEKLY_DIFFICULTY_PATTERN[day % WEEKLY_DIFFICULTY_PATTERN.length],
      );
    });
  });

  it("still gives a valid tier for days before the launch", () => {
    expect(pickDailySpec(-1, 0).tier).toBe(WEEKLY_DIFFICULTY_PATTERN[6]);
    expect(pickDailySpec(-7, 0).tier).toBe(WEEKLY_DIFFICULTY_PATTERN[0]);
    expect(pickDailySpec(-8, 0).tier).toBe(WEEKLY_DIFFICULTY_PATTERN[6]);
  });

  it("gives different games different seeds for the same day", () => {
    expect(pickDailySpec(3, 1000).seed).not.toBe(pickDailySpec(3, 2000).seed);
  });
});
