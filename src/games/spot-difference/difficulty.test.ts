import { describe, expect, it } from "vitest";
import { DIFFICULTIES } from "../../core/difficulty";
import { DIFFERENCE_COUNT, TIER_PROFILES } from "./difficulty";

describe("TIER_PROFILES", () => {
  it("has a profile for every difficulty with sensible ranges", () => {
    DIFFICULTIES.forEach((tier) => {
      const profile = TIER_PROFILES[tier];
      expect(profile.moveDistance[0]).toBeLessThan(profile.moveDistance[1]);
      expect(profile.resizeShare[0]).toBeLessThan(profile.resizeShare[1]);
      expect(profile.shadeSteps).toBeGreaterThan(0);
      expect(profile.minTargetArea).toBeLessThan(profile.maxTargetArea);
    });
  });

  it("makes every change smaller and the targets smaller as the tier gets harder", () => {
    const { easy, medium, hard } = TIER_PROFILES;
    expect(easy.moveDistance[0]).toBeGreaterThan(medium.moveDistance[0]);
    expect(medium.moveDistance[0]).toBeGreaterThan(hard.moveDistance[0]);
    expect(easy.resizeShare[0]).toBeGreaterThan(medium.resizeShare[0]);
    expect(medium.resizeShare[0]).toBeGreaterThan(hard.resizeShare[0]);
    expect(easy.shadeSteps).toBeGreaterThanOrEqual(hard.shadeSteps);
    expect(easy.maxTargetArea).toBeGreaterThan(hard.maxTargetArea);
  });

  it("asks for five differences", () => {
    expect(DIFFERENCE_COUNT).toBe(5);
  });
});
