import { describe, expect, it } from "vitest";
import { calculateContrast } from "../../testing/contrast";
import { MARKER_COLOURS } from "./markerColours";
import { THEME_COLOURS } from "./recipes";

describe("MARKER_COLOURS", () => {
  const backgrounds = Object.entries(THEME_COLOURS).flatMap(([theme, colours]) => [
    [`${theme} sky`, colours.sky],
    [`${theme} ground`, colours.ground],
  ]);

  it.each(backgrounds)("keeps the found circle visible on the %s", (_name, background) => {
    expect(calculateContrast(MARKER_COLOURS.found, background)).toBeGreaterThanOrEqual(3);
  });

  it.each(backgrounds)(
    "keeps the missed circle and the wrong-tap cross visible on the %s",
    (_name, background) => {
      expect(calculateContrast(MARKER_COLOURS.missed, background)).toBeGreaterThanOrEqual(3);
    },
  );

  it("uses a white halo, which stands out from both marker colours", () => {
    expect(MARKER_COLOURS.halo).toBe("#ffffff");
    expect(calculateContrast(MARKER_COLOURS.halo, MARKER_COLOURS.found)).toBeGreaterThan(3);
    expect(calculateContrast(MARKER_COLOURS.halo, MARKER_COLOURS.missed)).toBeGreaterThan(3);
  });
});
