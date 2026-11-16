import { describe, expect, it } from "vitest";
import { DIFFICULTIES } from "../../core/difficulty";
import { TIER_SETTINGS } from "./difficulty";

describe("TIER_SETTINGS", () => {
  it("has settings for every difficulty with a sensible lookahead range", () => {
    DIFFICULTIES.forEach((tier) => {
      const settings = TIER_SETTINGS[tier];
      expect(settings.minLookaheads).toBeLessThanOrEqual(settings.maxLookaheads);
      expect(settings.density).toBeGreaterThan(0);
      expect(settings.density).toBeLessThan(0.25);
    });
  });

  it("makes the grid bigger and the logic deeper as the tier gets harder", () => {
    const { easy, medium, hard } = TIER_SETTINGS;
    expect(easy.size).toBeLessThan(medium.size);
    expect(medium.size).toBeLessThan(hard.size);
    expect(easy.minLookaheads).toBeLessThan(medium.minLookaheads);
    expect(medium.minLookaheads).toBeLessThan(hard.minLookaheads);
  });
});
