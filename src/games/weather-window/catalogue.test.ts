import { describe, expect, it } from "vitest";
import { DAY_NAMES, FIT, MAX_FIT, TRIPS, WEATHERS, readFit, readShortDayName } from "./catalogue";

describe("catalogue", () => {
  it("gives every trip a score for every weather, from 0 to the maximum", () => {
    expect(FIT).toHaveLength(TRIPS.length);
    FIT.forEach((row) => {
      expect(row).toHaveLength(WEATHERS.length);
      row.forEach((points) => {
        expect(Number.isInteger(points)).toBe(true);
        expect(points).toBeGreaterThanOrEqual(0);
        expect(points).toBeLessThanOrEqual(MAX_FIT);
      });
    });
  });

  it("gives every trip a weather that earns the maximum", () => {
    FIT.forEach((row) => expect(Math.max(...row)).toBe(MAX_FIT));
  });

  it("reads the fit of a trip in a weather", () => {
    expect(readFit(0, 0)).toBe(3);
    expect(readFit(4, 0)).toBe(0);
    expect(readFit(4, 4)).toBe(3);
  });

  it("has a unique id for every weather, trip and day", () => {
    [WEATHERS, TRIPS, DAY_NAMES].forEach((list) => {
      expect(new Set(list.map((item) => item.id)).size).toBe(list.length);
    });
  });

  it("shortens day names to three letters", () => {
    expect(readShortDayName(0)).toBe("Mon");
    expect(readShortDayName(6)).toBe("Sun");
  });
});
